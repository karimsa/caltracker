import 'bootstrap/dist/css/bootstrap.min.css'
import '@babel/polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom'

import './app.scss'
import { Home } from './components/home'
import { Login } from './components/login'

function App() {
	return (
		<Router>
			<Switch>
				<Route exact path="/" component={Home} />
				<Route exact path="/login" component={Login} />
			</Switch>
		</Router>
	)
}

ReactDOM.render(<App />, document.getElementById('app'))
