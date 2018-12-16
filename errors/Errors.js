class NotFoundError extends Error{
    constructor(msg){
        super(msg);
        this.type = "NotFoundError";
    }
}




module.exports = {
    NotFoundError
};