const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose= require("mongoose")
const bodyParser= require("body-parser");
app.use(bodyParser.urlencoded({extended: false}))
try {
  console.log("waiting")
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}
catch(e){
  console.log(e)
}
let userSchema=mongoose.Schema({
  username:{
    type: String,
    required: true
  }
})
let exeSchema=mongoose.Schema({
  id:{
    type: String,
    required:true
  },
  username:String,
  description:String,
  duration:Number,
  date:String
}
)
let logSchema=mongoose.Schema({
  username:String,
  id:String,
  log:[{
  description:String,
  duration:Number,
  date:String }]
  })
let userdb = mongoose.model("User",userSchema)
let exedb = mongoose.model("Exercises",exeSchema)
let logdb = mongoose.model("Log",logSchema)
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users",async (req,res)=>{
let user = new userdb({username:req.body.username})
let doc= await user.save();
res.json({username:doc.username,_id:doc._id});
})
app.get('/api/users',async(req,res)=>{
  let userlist= await userdb.find();
  res.json(userlist)
})
app.post("/api/users/:_id/exercises",async (req,res)=>{
  let id= req.params._id;
  let description=req.body.description;
  let duration = req.body.duration;
  let userdoc= await userdb.findById(id)
  let date=req.body.date;
  console.log(date)
if(!date){
  date = new Date().toDateString()
  console.log(date)
}
else{
  let captureformat= new Date(date);
  date = captureformat.toDateString()
  console.log(captureformat,date)
}
let exe = new exedb({id:id,username:userdoc.username,description:description,duration:duration,date:date})
let doc = await exe.save();
let log = await logdb.findOne({id:id})
if(log==null){let log = new logdb({id:id,
  username:userdoc.username,
  log:[{description:description,duration:duration,date:date}]})
  await log.save()}
else{
  await logdb.findOneAndUpdate(
    { id:id},                         
      { $push: { log:[{description:description,duration:duration,date:date}]  } },                  
      { new: true }
  )
}
res.json(
  {  _id: doc.id,
    username: doc.username,
    date: doc.date,
    duration: doc.duration,
    description: doc.description,
  }
)
})
app.get("/api/users/:_id/logs",async (req,res)=>{
  let id = req.params._id
  let {from,to,limit}=req.query
  let doc = await logdb.findOne({id:id});
  let log=doc.log;
  let fromdate,todate;
  let fromexist=false,toexist=false;
  if(from){
     fromdate=new Date(from)
    log=log.filter(log=>new Date(log.date)>=fromdate)
    fromexist=true
  }
  if(to){
     todate= new Date(to)
    log= log.filter(log=>new Date(log.date)<=todate)
 toexist=true
  }
  if(limit){
    log=log.slice(0,Number(limit))
  }
  console.log(from,limit,to)
if(fromexist && toexist){
  res.json({
    username:doc.username,
    from:fromdate.toDateString(),
    to:todate.toDateString(),
     count:log.length,
    _id:doc.id,
    log:log
  })
}
else if(fromexist){
  res.json({
    username:doc.username,
    from:fromdate.toDateString(),
   
     count:log.length,
    _id:doc.id,
    log:log.map(log=>({
      description: log.description,
      duration: log.duration,
      date: log.date
    }))
  })
}
else if(toexist){
  res.json({
    username:doc.username,
    
    to:todate.toDateString(),
     count:log.length,
    _id:doc.id,
    log:log
  })
}
else{
  res.json({
    username:doc.username,
     count:log.length,
    _id:doc.id,
    log:log
  })
}
})
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
