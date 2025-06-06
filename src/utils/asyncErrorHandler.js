module.exports = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch(err => {
            console.log("Error caught:", err);  // error log
            next(err);
        });
    }
}
