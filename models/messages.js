const mongoose = require('mongoose')

const msgSchema = new mongoose.Schema(
	{
		from: { type: String },
        room: { type: String },
        message: { type: String },
        createon: {type:Date, default : Date.now}

	},
	{ collection: 'msg' }
)

const model = mongoose.model('msg',msgSchema )

module.exports = model