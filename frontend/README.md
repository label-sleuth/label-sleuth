# Sleuth annotation system

## System access
you can directly check the latest progress via this [website](http://35.223.89.10:8000/)

## Local installation
Below are instructions to run this website in your local environment

### Step 1: 
Clone the repo to your local directory:\
    `git clone https://github.com/roryzhengzhang/Sleuth.git`

### Step 2:
Under the cloned directory, install the dependency:\
    `npm install`

### Step 3:
Under the cloned directory, run the app in the development mode:\
    `npm run start:dev`

### Step 4:
Under the cloned directory, run the app in the production mode:\
    `npm run start:prod`

## Run the application with Docker
 
### Step 1: 
Under the cloned directory, build the docker image:\
    `docker build -t sleuth . `

### Step 2: 
Under the cloned directory, run the docker image:\
    `docker run -p 3000:3000 -d sleuth`


## Note:
This project expects npm version '8.5.5' and node version '17.7.2' 