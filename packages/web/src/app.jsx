import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import '@babel/polyfill'
import '@fortawesome/fontawesome-free/css/all.min.css'
import $ from 'jquery'
import React from 'react'
import ReactDOM from 'react-dom'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom'

import './app.scss'
import { Home } from './components/home'
import { Login } from './components/login'

if ((process.env.NODE_ENV || 'development') === 'development') {
	window.$ = window.jQuery = $
}

function App() {
	return (
		<Router>
			<Switch>
				<Route exact path="/login" component={Login} />
				<Route component={Home} />
			</Switch>
		</Router>
	)
}

ReactDOM.render(<App />, document.getElementById('app'))
