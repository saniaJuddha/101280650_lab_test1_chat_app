const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true },
        firstname: { type: String, required: true},
        lastname: { type: String, required: true},
        password: { type: String, required: true },
        createon: {type:Date, default : Date.now}
	},
	{ collection: 'users' }
)

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model