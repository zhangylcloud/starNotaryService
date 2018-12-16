const express = require('express');
let app = express();

const bodyParser = require('body-parser');

class BlockAPI {

    /**
     * Constructor that allows initialize the class 
     */
    async initialize() {
        this.app = express();
        this.initExpress();
        this.initExpressMiddleWare();
        await this.initControllers();
        this.start();
    }

    /**
     * Initialization of the Express framework
     */
    initExpress() {
        this.app.set("port", 8000);
    }

    /**
     * Initialization of the middleware modules
     */
    initExpressMiddleWare() {
        this.app.use(bodyParser.urlencoded({extended:true}));
        this.app.use(bodyParser.json());
    }

    /**
     * Initialization of all the controllers
     */
    async initControllers() {
        let blockchainController = require("./businessLogic/starRegistrationController")(this.app);
        await blockchainController.initialize();
    }

    /**
     * Starting the REST Api application
     */
    start() {
        let self = this;
        this.app.listen(this.app.get("port"), () => {
            console.log(`Server Listening for port: ${self.app.get("port")}`);
        });
    }

}

async function startBlockchainWebService(){
    let blockAPI = new BlockAPI();
    await blockAPI.initialize();
}

startBlockchainWebService();

