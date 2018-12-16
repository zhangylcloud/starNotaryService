//TODO list, schema validation, to make sure only one star is send in the request

const Blockchain = require('../blockchain/simpleChain');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');
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
        this.lookUpByWalletAddressReg();
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
            let currentTime = new Date().getTime().toString().slice(0, -3);
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
                res.status(400).send("Identity verification failed! Returning");
                return;
            }

            let currentTime = new Date().getTime().toString().slice(0,-3);
            let timeElapse = currentTime - memPoolObj.requestTime;
            let timeLeft = TimeoutRequestsWindowTime / 1000 - timeElapse;
            memPoolObj.timeLeft = timeLeft;

            res.status(200).json({
                "registerStar" : true,
                "status" : {
                    "address" : address,
                    "requestTimeStamp" : requestTimeStamp,
                    "message" : message,
                    "validationWindow" : memPoolObj.timeLeft,
                    "messageSignature" : true
                }
            });
            memPoolObj.walletValidated = true;
            return;
        });

    }

    registerStarReg(){
        this.app.post("/block", async (req, res) => {
            let address = req.body.address;
            //Check if this address is already in the mempool
            if(!this.memPool[address]){
                console.log("the wallet address is not in mempool or has timed out, please requestValidation");
                res.status(400).send("the wallet address not in mempool or has timed out, please requestValidation");
                return;
            }

            let star = req.body.star;
            let story = star.story;
            let storyBuffer = Buffer.from(story, "utf8");
            let hexEncodedStory = storyBuffer.toString("hex");
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
                console.log("In controller 2, after adding new block and new block is ");
                console.log(newBlock);
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
                let resultBlock = await this.blockchain.getBlockByHash(blockHash);
                resultBlock.body.star.storyDecoded = hex2ascii(resultBlock.body.star.story);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find block with hash: ' + blockHash);
                    res.status(400).send("Cannot find block with hash: " + blockHash);
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    lookUpByWalletAddressReg(){
        this.app.get("/stars/address:addr", async (req, res) => {
            // Add your code here
            let address = req.params.addr;
            try{
                let resultBlocks = await this.blockchain.getBlockByAddress(address);
                for(let blockIndex in resultBlocks){
                    resultBlocks[blockIndex].body.star.storyDecoded = hex2ascii(resultBlocks[blockIndex].body.star.story);
                }
                res.send(resultBlocks);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find any block with wallet address: ' + address);
                    res.status(400).send('Cannot find any block with wallet address: ' + address);
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }

    lookUpByHeightReg(){
        this.app.get("/stars/:height", async (req, res) => {
            // Add your code here
            let blockIndex = req.params.height;
            try{
                let resultBlock = await this.blockchain.getBlock(blockIndex);
                resultBlock = JSON.parse(resultBlock);
                resultBlock.body.star.storyDecoded = hex2ascii(resultBlock.body.star.story);
                res.send(resultBlock);
            }
            catch(err){
                if(err.type == 'NotFoundError'){
                    console.log('Cannot find block with height: ' + blockIndex);
                    res.status(400).send('Cannot find block with height: ' + blockIndex);
                }
                else{
                    console.log("Bad request");
                    res.status(400).send("Bad request");
                }
            }
        });
    }
}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new StarRegistrationController(app);}