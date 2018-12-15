//TODO list, schema validation, to make sure only one star is send in the request



const Blockchain = require('../blockchain/simpleChain');
const bitcoinMessage = require('bitcoinjs-message');
const TimeoutRequestsWindowTime = 5*60*1000;

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class StarRegistrationController {
    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */

    constructor(app){
        this.app = app;
        this.memPool = {};
        this.clearTimeoutPool = {};
    }

    /**
     * Mempool Format example:
     * {
     *     address1 : 
     *     {
     *         "address" : "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
     *         "walletValidated" : true,
     *         "requestTime" : 0000000000,
     *         "timeLeft" : 0000000100
     *     } 
     *     address2 :
     *     {
     *         ......
     *     }
     *     ......
     * } 
     */

    async initialize() {
        this.blockchain = new Blockchain();
        await this.blockchain.initialize();
        //this.initializeMockData();
        //this.getBlockByIndex();
        //this.postNewBlock();
        this.requestValidationReg();
        this.validateReg();
        this.registerStarReg();
        this.lookUpByHashReg();
        this.lookUpByAddressReg();
        this.lookUpByHeightReg();
    }

    removeValidationRequest(address){
        delete this.memPool[address];
        delete this.clearTimeoutPool[address];
    }

    requestValidationReg(){
        this.app.post("/requestValidation", (req, res) => {
            //-----Check this
            let address = req.body.address;
            //Check if this address is already in the mempool
            if(this.memPool[address]){
                let memPoolObj = this.memPool[address];
                let currentTime =  new Date().getTime().toString().slice(0,-3);
                let timeElapse = currentTime - memPoolObj.requestTime;
                let timeLeft = TimeoutRequestsWindowTime / 1000 - timeElapse;
                //if(timeLeft < 0){
                //    console.log("validationRequest passes window time but still remains in mempool, should be removed");
                //    res.status(400).send("validationRequest passes window time but still remains in mempool, should be removed");
                //    return;
                //}
                memPoolObj.timeLeft = timeLeft;
                res.status(200).json({
                    "walletAddress" : memPoolObj.address,
                    "requestTimeStamp" : memPoolObj.requestTime,
                    "message" : memPoolObj.address + ":" + memPoolObj.requestTime + ":starRegistry",
                    "validationWindow" : memPoolObj.timeLeft
                });
                return;
            }

            let memPoolObj = {};
            let currentTime = new Data().getTime().toString().slice(0, -3);
            memPoolObj.address = address;
            memPoolObj.walletValidated = false;
            memPoolObj.requestTime = currentTime;
            memPoolObj.timeLeft = TimeoutRequestsWindowTime / 1000;
            this.memPool[address] = memPoolObj;
            this.clearTimeoutPool[address] = setTimeout(() => {
                this.removeValidationRequest(address);
            }, TimeoutRequestsWindowTime);
            res.status(200).json({
                "walletAddress" : memPoolObj.address,
                "requestTimeStamp" : memPoolObj.requestTime,
                "message" : memPoolObj.address + ":" + memPoolObj.requestTime + ":starRegistry",
                "validationWindow" : memPoolObj.timeLeft
            });
            return;
        });
    }

    validateReg(){
        this.app.post("/message-signature/validate", (req, res) => {
            //-----Check this
            let address = req.body.address;
            let signature = req.body.signature;
            //Check if this address is already in the mempool
            if(!this.memPool[address]){
                console.log("the wallet address is not in mempool or has timed out, please requestValidation");
                res.status(400).send("the wallet address not in mempool or has timed out, please requestValidation");
                return;
            }
            let memPoolObj = this.memPool[address];
            let requestTimeStamp = memPoolObj.requestTime;
            let message = address + ":" + requestTimeStamp + ":starRegistry";
            let verifyResult = bitcoinMessage.verify(message, address, signature);
            if(!verifyResult){
                console.log("Identity verification failed! Returning");
                res.status(400).send("Identity verification failed!");
                return;
            }

            let currentTime = new Date().getTime().toString().slice(0,-3);
            let timeElapse = currentTime - memPoolObj.requestTime;
            let timeLeft = TimeoutRequestsWindowTime / 1000 - timeElapse;
            memPoolObj.timeLeft = timeLeft;

            res.status(200).json({
                "address" : address,
                "requestTimeStamp" : requestTimeStamp,
                "message" : message,
                "validationWindow" : memPoolObj.timeLeft,
                "messageSignature" : "valid"
            });
            memPoolObj.walletValidated = true;
            return;
        });

    }

    registerStarReg(){
        this.app.post("/block", async (req, res) => {
            //-----Check this
            let starBlock = req.body.block;
            let address = starBlock.address;
            //Check if this address is already in the mempool
            if(!this.memPool[address]){
                console.log("the wallet address is not in mempool or has timed out, please requestValidation");
                res.status(400).send("the wallet address not in mempool or has timed out, please requestValidation");
                return;
            }

            let star = starBlock.star;
            let story = star.story;
            let storyBuffer = Buffer.from(story, "utf8");
            let hexEncodedStory = storybuffer.toString("hex");
            let body = {
                "address" : address,
                "star" : {
                    "ra" : star["ra"],
                    "dec" : star["dec"],
                    "mag" : star["mag"],
                    "cen" : star["cen"],
                    "story" : hexEncodedStory
                }
            }
            try{
                console.log("Adding block to chain");
                let newBlock = await this.blockchain.addBlockFromObj(body);
                newBlock.body.star.storyDecoded = hex2ascii(newBlock.body.star.story);
                res.status(200).json(newBlock);
            }
            catch(err){
                console.log("Error occurs while adding block with message");
                console.log(body);
                res.status(400).send("Error occurs while adding block with message");
            }
            return;
        });

    }

    lookUpByHashReg(){
        this.app.get("/stars/hash:hashValue", async (req, res) => {
            // Add your code here
            let blockHash = req.params.hashValue;
            try{
                console.log("Getting the block with hash" + blockHash);
                let resultBlock = await this.blockchain.getBlockByHash(blockHash);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find block with hash' + blockHash);
                    res.status(400).send("Bad request, block not found");
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    lookUpByWalletAddress(){
        this.app.get("/stars/:address", async (req, res) => {
            // Add your code here
            let address = req.params.address;
            try{
                console.log("Getting the block with wallet address" + address);
                let resultBlock = await this.blockchain.getBlockByAddress(address);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find any block with wallet address' + address);
                    res.status(400).send("Bad request, no block found");
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    lookUpByHeightReg(){
        this.app.get("/stars/:index", async (req, res) => {
            // Add your code here
            let blockIndex = req.params.index;
            try{
                console.log("Getting the block with index " + blockIndex);
                let resultBlock = await this.blockchain.getBlock(blockIndex);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find block with index ' + blockIndex);
                    res.status(400).send("Bad request, block not found");
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/:index"
     */
    getBlockByIndex() {
        this.app.get("/block/:index", async (req, res) => {
            // Add your code here
            let blockIndex = req.params.index;
            try{
                console.log("Getting the block with index " + blockIndex);
                let resultBlock = await this.blockchain.getBlock(blockIndex);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find block with index ' + blockIndex);
                    res.status(400).send("Bad request, block not found");
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", async (req, res) => {
            // Add your code here
            let body = req.body.body;
            //console.log(req);
            if(!body){
                console.log("Bad request, invalid/empty body message");
                res.status(400).send("Bad request, invalid/empty body message");
                return;
            }
            try{
                console.log("Adding block to chain");
                await this.blockchain.addBlockFromMsg(body);
            }
            catch(err){
                console.log("Error occurs while adding block with message");
                console.log(body);
                res.status(400).send("Bad post request");
            }
            try{
                console.log("Getting back the newly add block");
                let curHeight = await this.blockchain.getBlockHeight();
                let blockAdded = await this.blockchain.getBlock(curHeight);
                res.status(201).send(blockAdded);
            }
            catch(err){
                console.log("Block added, but cannot get it back");
                res.status(400).send("Block added, but cannot get it back, something goes wrong");
            }
        });
    }
}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}