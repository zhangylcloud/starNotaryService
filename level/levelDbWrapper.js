/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const chainDB = './chaindata';
const level = require('level');
const db = level(chainDB);
const NotFoundError = require('../Errors/Errors').NotFoundError;


module.exports = class levelWrapper{
    constructor(){
        console.log("level db is constructing");
    }
    async put(key, value){
        return await db.put(key, value);
    }

    async get(key, value){
        return await db.get(key);
    }

    async getNumKeys(){
        let height = 0;
        return await new Promise(function(resolve, reject){
            db.createReadStream().on('data', function(data){
              height++;
            }).on('end', function(){
              resolve(height);
            });
        });
    }

    async getBlockByHash(hash){
        let block = undefined;
        return new Promise(function(resolve, reject){
           db.createReadStream()
           .on('data', function (data) {
               data.value = JSON.parse(data.value);
               if(data.value.hash === hash){
                   block = data.value;
               }
           })
           .on('error', function (err) {
               reject(err)
           })
           .on('close', function () {
               if(block === undefined){
                   reject(new NotFoundError("Can't find block with hash: " + hash));
               }
               else{
                   resolve(block);
               }
           });
       }); 
    }

    async getBlockByAddress(address){
        let blocks = [];
        return new Promise(function(resolve, reject){
            db.createReadStream()
            .on('data', function (data) {
                data.value = JSON.parse(data.value);
                if(data.value.body.address === address){
                    blocks.push(data.value);
                }
            })
            .on('error', function (err) {
                reject(err)
            })
            .on('close', function () {
                if(blocks.length === 0){
                    reject(new NotFoundError("Can't find block with address: " + address));
                }
                else{
                    resolve(blocks);
                }
            });
        });
    }

    async printDb(){
        console.log("Start printing");
        return new Promise(function(resolve, reject){
            db.createReadStream().on('data', console.log).on('end', function(){
                console.log("Done printing");
                resolve();
            });
        });
    }
}
