import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom'

import { Home } from './components/home.jsx'

function App() {
	return (
		<Router>
			<Switch>
				<Route exact path="/" component={Home} />
			</Switch>
		</Router>
	)
}

ReactDOM.render(<App />, document.getElementById('app'))
