const mongoose = require("mongoose")


exports.connectMongoose = () =>{
    mongoose.connect(`mongodb+srv://vrndrmry13:8w6JneW2aVKl9OSd@cluster0.rlq91qy.mongodb.net/?retryWrites=true&w=majority`,{
        useNewUrlParser: true,
        useUnifiedTopology:true,
    }).then(()=>{
        console.log("Connected to MongoDB")
    }).catch(err=>{
        console.log(err)
    })
}

const user = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username:{
        type:String,
        unique:true,
        required:true,
        min:4,
    },
    password:{
        type:String,
        required:true,
        min:4
    }
})

exports.User = new mongoose.model("User",user)