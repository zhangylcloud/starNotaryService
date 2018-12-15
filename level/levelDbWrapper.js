/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const chainDB = './chaindata';
const level = require('level');
const db = level(chainDB);


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
        let block = null;
        return new Promise(function(resolve, reject){
           self.db.createReadStream()
           .on('data', function (data) {
               if(data.hash === hash){
                   block = data;
               }
           })
           .on('error', function (err) {
               reject(err)
           })
           .on('close', function () {
               resolve(block);
           });
       }); 
    }

    async getBlockByAddress(address){
        let blocks = [];
        return new Promise(function(resolve, reject){
            self.db.createReadStream()
            .on('data', function (data) {
                if(data.body.address === address){
                    blocks.push(data);
                }
            })
            .on('error', function (err) {
                reject(err)
            })
            .on('close', function () {
                resolve(blocks);
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
