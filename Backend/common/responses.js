module.exports.responseSuccess = (res,data , msg="Operation Completed Successfully") => {
    res.status(200).json({
        success:true,
        data:data,
        message:msg
    })
}
module.exports.responseFailure = (res,msg="Operation Failed") => {
    res.status(500).json({
        success:false,
        message:msg
    })
}
module.exports.responseForbidden = (res,msg="Fobidden") => {
    res.status(401).json({
        success:false,
        message:msg
    })
}
module.exports.responseBadRequest = (res,msg="Bad Request") => {
    res.status(400).json ({
        success:false,
        message:msg
    })
}