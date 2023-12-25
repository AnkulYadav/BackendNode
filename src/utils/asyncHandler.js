// method 1
function asyncHanlder(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message || 'Server Error'
            })

        }
    }
}

// method 2
/* const asyncHanlder = (requestHandler) =>{
    (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}
*/
export {asyncHanlder}