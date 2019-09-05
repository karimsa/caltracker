import mongoose from 'mongoose'
import memoize from 'mem'
import { logger, Config } from '@karimsa/boa'

mongoose.set('autoCreate', Config.bool('MongoAutoCreate'))
mongoose.set('debug', Config.bool('MongoDebug'))
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

export const Connect = memoize(function() {
	logger.verbose(`Connecting to mongo ...`)
	return mongoose.connect(
		Config.string(
			'MongoUrl',
			{
				development: 'mongodb://localhost/caltracker',
				test: 'mongodb://localhost/caltracker-test',
			}[Config.NodeEnv],
		),
		{
			useNewUrlParser: true,
			bufferCommands: Config.string('MongoBufferCommands'),
		},
	)
})

export { mongoose }
