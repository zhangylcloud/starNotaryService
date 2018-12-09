#!/bin/bash
echo "/////Please only run this test script after the service is running"
echo "/////This should return the genesis block"
curl -H "Content-Type: application/json" -X GET http://localhost:8000/block/0
printf "\n"

echo "/////This should add a new block to the chain, and we should see the newly added block"
curl -d '{"body":"a new block"}' -H "Content-Type: application/json" -X POST http://localhost:8000/block
printf "\n"

echo "/////This should return a error because we are trying to get a non-existing block"
curl -H "Content-Type: application/json" -X GET http://localhost:8000/block/-1
printf "\n"

echo "/////This should return a error because we are trying to post a block with empty payload"
curl -d '{"body":""}' -H "Content-Type: application/json" -X POST http://localhost:8000/block
printf "\n"
