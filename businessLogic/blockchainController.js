const Blockchain = require('../blockchain/simpleChain');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {
    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app){
        this.app = app;
    }

    async initialize() {
        this.blockchain = new Blockchain();
        await this.blockchain.initialize();
        //this.initializeMockData();
        this.getBlockByIndex();
        this.postNewBlock();
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