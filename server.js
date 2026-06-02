const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'cars.db');
let carRepository;
let carService;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    carRepository.initializeDatabase();
  }
});

class Car {
  constructor(id = 0, model = 'Unknown', dailyRate = 0.0, isAvailable = true, rentalTime = null) {
    this.id = id;
    this.model = model;
    this.dailyRate = dailyRate;
    this.isAvailable = isAvailable;
    this.rentalTime = rentalTime;
  }

  rentCar() {
    if (!this.isAvailable) {
      throw new Error('Car is already rented');
    }
    this.isAvailable = false;
    this.rentalTime = new Date().toISOString();
    return this.rentalTime;
  }

  returnCar() {
    if (this.isAvailable) {
      throw new Error('Car is already available');
    }
    const returnTime = new Date();
    const rentalStart = new Date(this.rentalTime);
    const hours = (returnTime - rentalStart) / (1000 * 60 * 60);
    const hourlyRate = this.dailyRate / 24;
    const cost = Number((hourlyRate * hours).toFixed(2));
    this.isAvailable = true;
    this.rentalTime = null;
    return { hours, cost };
  }
}

class MaintainedCar extends Car {
  constructor(id, model, dailyRate, isAvailable, rentalTime, lastServiceDate, mileage) {
    super(id, model, dailyRate, isAvailable, rentalTime);
    this.lastServiceDate = lastServiceDate;
    this.mileage = mileage;
  }

  updateMaintenanceInfo(serviceDate, mileage) {
    this.lastServiceDate = serviceDate;
    this.mileage = mileage;
  }
}

class CarRepository {
  constructor(database) {
    this.db = database;
  }

  initializeDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY,
        model TEXT NOT NULL,
        daily_rate REAL NOT NULL,
        is_available BOOLEAN DEFAULT 1,
        rental_time DATETIME,
        last_service_date TEXT,
        mileage INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Database table initialized');
      }
    });
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  toCar(row) {
    if (!row) return null;
    return new MaintainedCar(
      row.id,
      row.model,
      row.daily_rate,
      row.is_available === 1,
      row.rental_time,
      row.last_service_date || 'N/A',
      row.mileage || 0
    );
  }

  async getAllCars() {
    const rows = await this.all('SELECT * FROM cars ORDER BY id');
    return rows.map((row) => this.toCar(row));
  }

  async getCarById(id) {
    const row = await this.get('SELECT * FROM cars WHERE id = ?', [id]);
    return this.toCar(row);
  }

  async addCar(car) {
    await this.run(
      `INSERT INTO cars (id, model, daily_rate, last_service_date, mileage, is_available) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [car.id, car.model, car.dailyRate, car.lastServiceDate, car.mileage]
    );
  }

  async updateRentalStatus(car) {
    await this.run(
      'UPDATE cars SET is_available = ?, rental_time = ? WHERE id = ?',
      [car.isAvailable ? 1 : 0, car.rentalTime, car.id]
    );
  }

  async updateMaintenance(car) {
    await this.run(
      'UPDATE cars SET last_service_date = ?, mileage = ? WHERE id = ?',
      [car.lastServiceDate, car.mileage, car.id]
    );
  }
}

class CarService {
  constructor(repository) {
    this.repository = repository;
  }

  async listCars() {
    return this.repository.getAllCars();
  }

  async addCar(data) {
    const car = new MaintainedCar(
      data.id,
      data.model,
      data.rate,
      true,
      null,
      data.serviceDate,
      data.mileage
    );
    await this.repository.addCar(car);
  }

  async rentCar(id) {
    const car = await this.repository.getCarById(id);
    if (!car) {
      const error = new Error('Car not found');
      error.status = 404;
      throw error;
    }
    let rentalTime;
    try {
      rentalTime = car.rentCar();
    } catch (error) {
      error.status = 400;
      throw error;
    }
    await this.repository.updateRentalStatus(car);
    return { car, rentalTime };
  }

  async returnCar(id) {
    const car = await this.repository.getCarById(id);
    if (!car) {
      const error = new Error('Car not found');
      error.status = 404;
      throw error;
    }
    let hours;
    let cost;
    try {
      ({ hours, cost } = car.returnCar());
    } catch (error) {
      error.status = 400;
      throw error;
    }
    await this.repository.updateRentalStatus(car);
    return { car, hours, cost };
  }

  async searchCar(id) {
    const car = await this.repository.getCarById(id);
    if (!car) {
      const error = new Error('Car not found');
      error.status = 404;
      throw error;
    }
    return car;
  }

  async checkAvailability(id) {
    const car = await this.repository.getCarById(id);
    if (!car) {
      const error = new Error('Car not found');
      error.status = 404;
      throw error;
    }
    return car.isAvailable;
  }

  async updateMaintenance(id, serviceDate, mileage) {
    const car = await this.repository.getCarById(id);
    if (!car) {
      const error = new Error('Car not found');
      error.status = 404;
      throw error;
    }
    car.updateMaintenanceInfo(serviceDate, mileage);
    await this.repository.updateMaintenance(car);
  }
}

carRepository = new CarRepository(db);
carService = new CarService(carRepository);


app.get('/api/cars', async (req, res) => {
  try {
    const cars = await carService.listCars();
    const formattedCars = cars.map(car => ({
      id: car.id,
      model: car.model,
      rate: car.dailyRate,
      available: car.isAvailable,
      serviceDate: car.lastServiceDate || 'N/A',
      mileage: car.mileage || 0,
      type: 'MaintainedCar'
    }));
    res.json(formattedCars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cars/add', async (req, res) => {
  const { id, model, rate, serviceDate, mileage } = req.body;

  if (!id || !model || !rate) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    await carService.addCar({ id, model, rate, serviceDate, mileage });
    res.json({ success: true, message: 'Car added successfully' });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cars/rent', async (req, res) => {
  const { id } = req.body;

  try {
    const { car, rentalTime } = await carService.rentCar(id);
    res.json({ success: true, message: `✓ ${car.model} rented successfully at ${new Date(rentalTime).toLocaleString()}` });
  } catch (error) {
    console.error('Error renting car:', error);
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

app.post('/api/cars/return', async (req, res) => {
  const { id } = req.body;

  try {
    const { car, hours, cost } = await carService.returnCar(id);
    res.json({
      success: true,
      message: `✓ ${car.model} returned after ${hours.toFixed(2)} hours. Total cost: Rs. ${cost.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error returning car:', error);
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

app.get('/api/cars/search/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const car = await carService.searchCar(id);
    const output = `
Car ID: ${car.id}
Model: ${car.model}
Daily Rate: Rs. ${car.dailyRate}
Status: ${car.isAvailable ? 'Available' : 'Rented'}
Last Service Date: ${car.lastServiceDate}
Mileage: ${car.mileage} km
    `;

    res.json({ success: true, data: output });
  } catch (error) {
    console.error('Error searching car:', error);
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

app.get('/api/cars/availability/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const available = await carService.checkAvailability(id);
    res.json({ success: true, available });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

app.put('/api/cars/maintenance/:id', async (req, res) => {
  const { id } = req.params;
  const { serviceDate, mileage } = req.body;

  try {
    await carService.updateMaintenance(id, serviceDate, mileage);
    res.json({ success: true, message: 'Maintenance info updated successfully' });
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n Car Rental System Server`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}\n`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\nDatabase closed');
    }
    process.exit(0);
  });
});
