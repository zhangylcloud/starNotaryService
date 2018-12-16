# Star Notary Service
## For Udacity project 4

## Node Framework:
Express

## Endpoint
1. GET:

Look up by hash:
http://localhost:8000/stars/hash:[HASH]

Look up by address (may return multiple blocks registered by the same address)
http://localhost:8000/stars/address:[ADDRESS]

Look up by block height:
http://localhost:8000/block/[HEIGHT]
  

2. POST:

Send ValidationRequest:
http://localhost:8000/requestValidation
with { "address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL" }

Send validate request:
http://localhost:8000/message-signature/validate
with 
{
"address":"19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
 "signature":"H8K4+1MvyJo9tcr2YN2KejwvX1oqneyCH+fsUL1z1WBdWmswB9bijeFfOfMqK68kQ5RO6ZxhomoXQG3fkLaBl+Q="
}

Register a star:
http://localhost:8000/block
with 
{
    "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
    "star": {
                "dec": "68° 52' 56.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
}

## Example with cURL:
This has the examples of GET/POST requests. You can't run it directly. 
You need to use your own bitcoin public address and sign it with your bitcoin core

This sends a validation request using my public address
```curl -d '{"address":"mnckZaQxZu3x7QuNkSG3zFQZYMFxzntmtX"}' -H "Content-Type: application/json" -X POST http://localhost:8000/requestValidation```

This sends a validate request to verify the signature, you need to use your own bitcoin core to find your signature
```curl -d '{"address":"mnckZaQxZu3x7QuNkSG3zFQZYMFxzntmtX", "signature":"IOuW1k+fVvyvunG+ptVZdEaT5UfF2a3MFl9gMw/bL2NmH6ygWf+MTar2ux79xcTKUwzoZFyUQbdN6vcPRiG32QI="}' -H "Content-Type: application/json" -X POST http://localhost:8000/message-signature/validate```

This registers a star on blockchain. The json file with star info is in star1.json. please run from tests directory so star*.json can be read.
```curl -d @star1.json -H "Content-Type: application/json" -X POST http://localhost:8000/block```

This will return a block with hash 71c84166f61a310d87430e617bfbd57f31f64b4be91c745f3bb2fc282d902100
```curl -H "Content-Type: application/json" -X GET http://localhost:8000/stars/hash71c84166f61a310d87430e617bfbd57f31f64b4be91c745f3bb2fc282d902100```

This will return one or many blocks, registered by address mnckZaQxZu3x7QuNkSG3zFQZYMFxzntmtX
```curl -H "Content-Type: application/json" -X GET http://localhost:8000/stars/addressmnckZaQxZu3x7QuNkSG3zFQZYMFxzntmtX```

This will return a block with at height 1
```curl -H "Content-Type: application/json" -X GET http://localhost:8000/block/1```

## How to install
1. Clone the project from https://github.com/zhangylcloud/starNotaryService.git
2. In project root directory run `npm install`
3. Run `node index.js` 




