#include <iostream>
#include <string>
#include <fstream>
#include <ctime>
#include <sstream>

using namespace std;

class Car {
protected:
    int id;
    std::string model;
    double dailyRate;
    bool isAvailable;
    time_t rentalTime;

public:
    Car(int carId = 0, std::string carModel = "Unknown", double rate = 0.0)
        : id(carId), model(carModel), dailyRate(rate), isAvailable(true), rentalTime(0) {}

    string getModel() const { return model; }
    double getRate() const { return dailyRate; }

    virtual void rentCar() {
        if (isAvailable) {
            isAvailable = false;
            rentalTime = std::time(nullptr);
            std::cout << model << " (ID: " << id << ") rented at " << std::ctime(&rentalTime);
        } else {
            std::cout << model << " (ID: " << id << ") is already rented.\n";
        }
    }

    virtual void returnCar() {
        if (!isAvailable) {
            isAvailable = true;
            time_t returnTime = std::time(nullptr);
            double hours = difftime(returnTime, rentalTime) / 3600.0;
            double hourlyRate = dailyRate / 24.0;
            double cost = hourlyRate * hours;
            std::cout << model << " (ID: " << id << ") returned after " << hours << " hours.\n";
            std::cout << "Total cost: Rs. " << cost << "\n";
        } else {
            std::cout << model << " (ID: " << id << ") is already available.\n";
        }
    }

    virtual void display() const {
        std::cout << "ID: " << id << ", Model: " << model << ", Rate: Rs. " << dailyRate
                  << ", Available: " << (isAvailable ? "Yes" : "No") << "\n";
    }

    int getId() const { return id; }
    bool isCarAvailable() const { return isAvailable; }
};

class MaintainedCar : public Car {
    string lastServiceDate;
    int mileage;

public:
    MaintainedCar(int carId, string carModel, double rate, string serviceDate, int carMileage)
        : Car(carId, carModel, rate), lastServiceDate(serviceDate), mileage(carMileage) {}

    void updateMaintenanceInfo(string serviceDate, int carMileage) {
        lastServiceDate = serviceDate;
        mileage = carMileage;
    }

    void display() const override {
    cout << "----------------------------------------\n";
    cout << "Car Type: MaintainedCar\n";
    cout << "Car ID: " << id << "\n";
    cout << "Car Model: " << model << "\n";
    cout << "Daily Rate: Rs. " << dailyRate << "\n";
    cout << "Availability: " << (isAvailable ? "Available" : "Not Available") << "\n";
    cout << "Last Service Date: " << lastServiceDate << "\n";
    cout << "Mileage: " << mileage << " km\n";
    cout << "----------------------------------------\n";}

    string getLastServiceDate() const { return lastServiceDate; }
    int getMileage() const { return mileage; }
};

void saveData(Car* cars[], int carCount) {
    ofstream outFile("cars_data.txt", ios::out);
    if (outFile.is_open()) {
        outFile << carCount << "\n";
        for (int i = 0; i < carCount; ++i) {
            MaintainedCar* maintainedCar = dynamic_cast<MaintainedCar*>(cars[i]);
            if (maintainedCar) {
                outFile << "MaintainedCar "
                        << maintainedCar->getId() << " "
                        << maintainedCar->getModel() << " "
                        << maintainedCar->getRate() << " "
                        << maintainedCar->isCarAvailable() << " "
                        << maintainedCar->getLastServiceDate() << " "
                        << maintainedCar->getMileage() << "\n";
            } else {
                outFile << "Car "
                        << cars[i]->getId() << " "
                        << cars[i]->getModel() << " "
                        << cars[i]->getRate() << " "
                        << cars[i]->isCarAvailable() << "\n";
            }
        }
        outFile.close();
    }
}

void loadData(Car* cars[], int& carCount) {
    ifstream inFile("cars_data.txt");
    if (inFile.is_open()) {
        inFile >> carCount;
        inFile.ignore();

        string line;
        for (int i = 0; i < carCount; ++i) {
            getline(inFile, line);
            istringstream iss(line);

            string type;
            int id;
            string model;
            double rate;
            bool available;

            iss >> type >> id >> model >> rate >> available;

            if (type == "MaintainedCar") {
                string serviceDate;
                int mileage;
                iss >> serviceDate >> mileage;
                cars[i] = new MaintainedCar(id, model, rate, serviceDate, mileage);
            } else {
                cars[i] = new Car(id, model, rate);
            }

            if (!available) {
                cars[i]->rentCar();
            }
        }
        inFile.close();
    } else {
        carCount = 0;
    }
}

Car* findCarById(Car* cars[], int carCount, int id) {
    for (int i = 0; i < carCount; ++i) {
        if (cars[i]->getId() == id) {
            return cars[i];
        }
    }
    return nullptr;
}

int main() {
    const int MAX_CARS = 100;
    Car* cars[MAX_CARS];
    int carCount = 0;

    loadData(cars, carCount);

    int choice;
    while (true) {
        cout << "\n1. Add Cars to your service\n2. View Cars\n3. Rent a Car \n4. Return a Car \n5. Search by ID\n6. Check Availability \n7.View Maintenance Info\n8. Update Maintenance Info\n9. Exit\nChoose: ";
        cin >> choice;

        switch (choice) {
    case 1: {
        int id;
        string model;
        double rate;
        string serviceDate;
        int mileage;
        
        cout << "Enter Car ID: ";
        cin >> id;
        cout << "Enter Car Model: ";
        cin.ignore();  
        getline(cin, model);
        cout << "Enter Daily Rate: ";
        cin >> rate;

        cout << "Enter Last Service Date (YYYY-MM-DD): ";
        cin.ignore();  
        getline(cin, serviceDate);
        cout << "Enter Mileage: ";
        cin >> mileage;

        cars[carCount++] = new MaintainedCar(id, model, rate, serviceDate, mileage);
        
        cout << "Maintained car added successfully.\n";
        saveData(cars, carCount);  
        break;
    }

    case 2: {
        for (int i = 0; i < carCount; ++i) {
            cars[i]->display();
        }
        break;
    }

    case 3: {
        int id;
        cout << "Enter Car ID to rent: ";
        cin >> id;
        Car* car = findCarById(cars, carCount, id);
        if (car) {
            car->rentCar();
            saveData(cars, carCount);
        } else {
            cout << "Car with ID " << id << " not found.\n";
        }
        break;
    }

    case 4: {
        int id;
        cout << "Enter Car ID to return: ";
        cin >> id;
        Car* car = findCarById(cars, carCount, id);
        if (car) {
            car->returnCar();
            saveData(cars, carCount);
        } else {
            cout << "Car with ID " << id << " not found.\n";
        }
        break;
    }

    case 5: {
        int id;
        cout << "Enter Car ID to search: ";
        cin >> id;
        Car* car = findCarById(cars, carCount, id);
        if (car) {
            car->display();
        } else {
            cout << "Car with ID " << id << " not found.\n";
        }
        break;
    }

    case 6: {
        int id;
        cout << "Enter Car ID to check availability: ";
        cin >> id;
        Car* car = findCarById(cars, carCount, id);
        if (car) {
            cout << "Car ID " << id << " is "
                 << (car->isCarAvailable() ? "Available.\n" : "Not Available.\n");
        } else {
            cout << "Car with ID " << id << " not found.\n";
        }
        break;
    }

    case 7: {
        cout << "Maintenance Info for All Cars:\n";
        for (int i = 0; i < carCount; ++i) {
            MaintainedCar* maintainedCar = dynamic_cast<MaintainedCar*>(cars[i]);
            if (maintainedCar) {
                maintainedCar->display();
            }
        }
        break;
    }

    case 8: {
        int id;
        string lastServiceDate;
        int mileage;
        cout << "Enter Car ID to update maintenance info: ";
        cin >> id;
        cin.ignore();
        Car* car = findCarById(cars, carCount, id);
        MaintainedCar* maintainedCar = dynamic_cast<MaintainedCar*>(car);
        if (maintainedCar) {
            cout << "Enter Last Service Date (YYYY-MM-DD): ";
            getline(cin, lastServiceDate);
            cout << "Enter Mileage: ";
            cin >> mileage;
            maintainedCar->updateMaintenanceInfo(lastServiceDate, mileage);
            cout << "Maintenance info updated successfully.\n";
            saveData(cars, carCount);
        } else {
            cout << "Car with ID " << id << " not found or is not a maintained car.\n";
        }
        break;
    }

    case 9:
        cout << "Exiting program. Thank you!\n";
        saveData(cars, carCount);
        for (int i = 0; i < carCount; ++i) {
            delete cars[i];
        }
        return 0;

    default:
        cout << "Invalid choice. Please try again.\n";
}
    }}