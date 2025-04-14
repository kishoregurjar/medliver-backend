const successRes = (res, status, success, message, data) => {
    return res.status(status).json({
        success: success,
        status: status,
        message: message,
        data: data ? data : null
    })
}

const notFoundRes = (res, message, data) => {
    return res.status(404).json({
        success: false,
        status: 404,
        message: message,
        data: data ? data : null
    })
}

const badReqResponse = (res, message) => {
    return res.status(400).json({
        success: false,
        message: message
    })
}

const swrRes = (res) => {
    return res.status(400).json({
        success: false,
        message: 'Something Went Wrong'
    })
}

const catchRes = (res, error) => {
    return res.status(500).json({
        success: false,
        message: error.message
    })
}

module.exports = {
    successRes,
    swrRes,
    catchRes,
    notFoundRes,
    badReqResponse
}