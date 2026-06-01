# Car Rent – C++ Console Application

A menu-driven Car Rental Management System built in C++ that combines Object-Oriented Programming, file handling, and system design into a practical real-world project. With features like car inventory tracking, rentals & returns, cost calculation, and maintenance records, this project simulates the operations of a small-scale car rental service.

## Key Features

- Add, search, rent, and return cars with ease
- Track availability, model, daily rates, and mileage
- Manage maintenance records with last service dates
- Automatic rental cost calculation based on duration
- Persistent storage via file I/O for saving and loading car data
- Clean OOP structure with Car and MaintainedCar (inheritance) classes


## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/BhargavDevi/car_rent.git
cd car_rent
```

2. Compile the project:
```bash
# Using clang++
clang++ -o car_rental car.cpp

# OR using g++
g++ -o car_rental car.cpp
```

3. Run the program:
```bash
./car_rental
```

##  Project Structure

```
car_rent/
├── car.cpp          # Main source code file containing the implementation
└── README.md        # Project documentation
```

##  Usage Guide

When you run the program, you'll be presented with a menu-driven interface that allows you to:

1. Add new cars to the system
2. Search for available cars
3. Rent cars to customers
4. Return cars from customers
5. View maintenance records
6. Calculate rental costs
7. Save and load car data

Follow the on-screen prompts to navigate through these features.

##  Development

To modify or enhance the project:

1. Open `car.cpp` in your preferred code editor
2. Make your desired changes
3. Recompile using the compile command mentioned above
4. Test your changes thoroughly

This project serves as an ideal foundation for learners to understand C++ OOP concepts, inheritance, polymorphism, and file handling, while also showcasing how to design a real-world inspired system.

