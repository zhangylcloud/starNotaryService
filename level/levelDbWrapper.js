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
