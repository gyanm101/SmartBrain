import React, { Component } from 'react';
import Particles from 'react-particles-js';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isLoading: false,
  errorMessage: '',
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
    console.log("FULL CLARIFAI RESPONSE:", data.outputs);
    const regions = data.outputs?.[0]?.data?.regions;

    if (!regions || regions.length === 0) {
      console.log("No face regions found:", data);
      return [];
    }
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);

    return regions.map(region => {
        const box = region.region_info.bounding_box;
        console.log("Box", box);

        return {
              leftCol: box.left_col * width,
              topRow: box.top_row * height,
              rightCol: width - (box.right_col * width),
              bottomRow: height - (box.bottom_row * height)
        };
    });
  };

  displayFaceBoxes = (boxes) => {
    this.setState({boxes: boxes});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    if(!this.state.input){
        this.setState({errorMessage: "Please enter an image URL."});
        return;
    }

    this.setState({
        imageUrl: this.state.input,
        boxes: [],
        isLoading: true,
        errorMessage: ''
    });

  fetch('http://localhost:3000/imageurl', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      input: this.state.input
    })
  })
  .then(response => response.json())
  .then(response => {
  if (response) {
      fetch('http://localhost:3000/image', {
        method: 'put',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          id: this.state.user.id
        })
      })
        .then(response => response.json())
        .then(count => {
          this.setState(Object.assign(this.state.user, { entries: count}))
        })
        .catch(console.log)

    }
    const boxes = this.calculateFaceLocation(response);
    if (boxes.length === 0) {
      this.setState({
        errorMessage: 'No faces found. Try another image.',
        isLoading: false
      });
      return;
    }

    this.displayFaceBoxes(boxes);
    this.setState({ isLoading: false });

   })
  .catch(err => {
    console.log(err);
    this.setState({
      errorMessage: 'Something went wrong. Please try again.',
      isLoading: false
    });
  });
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, boxes, isLoading, errorMessage } = this.state;
    return (
      <div className="App">
         <Particles className='particles'
          params={particlesOptions}
        />
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        { route === 'home'
          ? <div>
              <Logo />
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              {isLoading && <p className="white f3">Detecting faces...</p>}
              {errorMessage && <p className="red f4">{errorMessage}</p>}
              <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
            </div>
          : (
             route === 'signin'
             ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
             : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
        }
      </div>
    );
  }
}

export default App;