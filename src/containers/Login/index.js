import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Image,
    AsyncStorage,
    Text,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'native-base';
import GoogleSignIn from 'react-native-google-sign-in';
import SplashScreen from 'react-native-splash-screen';

import { ActionCreators } from '../../redux/action';
import { Color } from '../../lib/color';
import firebase from '../../lib/firebase';
import * as Service from '../../lib/service';
import CustomLoadingView from '../../component/loading';

// import SplashScreen from 'react-native-splash-screen';

const FBSDK = require('react-native-fbsdk');
const {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} = FBSDK;

const logo = require('../../resource/image/login_logo.png');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.blue,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#E4E4E4',
  },
  button: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: Color.darkred,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: Color.text,
    shadowOffset: {
      width: 2,
      height: 4,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 30,
    color: Color.white,
    width: 40,
  },
  buttonText: {
    color: Color.white,
    fontSize: 20,
    paddingLeft: 15,
  },
  loadingView: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
});

export class Login extends Component {

  constructor(props) {
    super(props);
    const autoLogin = (this.props.navigation.state.params === undefined)
    ? true : this.props.navigation.state.params.autoLogin;
    this.state = {
      isLoading: false,
      showVideo: true,
      autoLogin: autoLogin !== undefined ? autoLogin : true,
    };
  }

  componentDidMount() {
    // const _this = this;
    setTimeout(() => {
      SplashScreen.hide();
      // _this.autoLogin();
    }, 2000);
    this.props.setLanguage();
  }

  autoLogin() {
    if (!this.state.autoLogin) return;
    setTimeout(() => {
      AsyncStorage.getItem('credential', (err, credential) => {
        AsyncStorage.getItem('myPhoto', (error, photo) => {
          console.log(credential);
          if (!err && credential != null) {
            this.setState({ isLoading: true });
            firebase.auth().signInWithCredential(JSON.parse(credential))
            .then((currentUser) => {
              if (currentUser) {
                console.info(JSON.stringify(currentUser.toJSON()));
                this.props.setUserInfo(currentUser, photo, () => {
                  this.setState({ isLoading: false });
                  this.onLoginSuccess();
                });
              }
            })
            .catch((e) => {
              Service.showAlert(`Login fail with error: ${e}`);
                // alert('Error occured while auto-login')
              this.setState({ isLoading: false });
            });
          }
        });
      });
    }, 800);
  }

  onLoginSuccess() {
    this.props.navigation.navigate('home', { index: 1 });
  }

  async onGoogleLogin() {
    if (Platform.OS === 'ios') {
      await GoogleSignIn.configure({
        clientID: '858245085093-qjs3s7mbmde8k5hcuq2esbr6ua2vkmll.apps.googleusercontent.com',
        scopes: ['openid', 'email', 'profile'],
        shouldFetchBasicProfile: true,
      });
    } else {
      await GoogleSignIn.configure({
        clientID: '858245085093-j01mhse92r76tngtamh9irdlphsrqffe.apps.googleusercontent.com',
        scopes: ['openid', 'email', 'profile'],
        shouldFetchBasicProfile: true,
        serverClientID: '858245085093-9k6oalpi2oko3h83eubdi37cktodhng7.apps.googleusercontent.com',
      });
    }


    const user = await GoogleSignIn.signInPromise();
    console.log('mytest', user);
    const credential = firebase.auth.GoogleAuthProvider.credential(user.idToken, user.accessToken);
    this.setState({ isLoading: true });
    AsyncStorage.setItem('credential', JSON.stringify(credential), () => {

    });
    // login with credential
    return firebase.auth().signInWithCredential(credential)
        .then((currentUser) => {
          if (currentUser) {
            console.log('Google_User', currentUser);
            this.props.setUserInfo(currentUser, user.photoUrl640, () => {
              this.setState({ isLoading: false });
              this.onLoginSuccess();
            });
          }
        })
        .catch((error) => {
          this.setState({ isLoading: false });
          console.log(`Login fail with error: ${error}`);
        });
        // console.log(user);
  }

  onFacebookLogin() {
    LoginManager
        .logInWithReadPermissions(['public_profile', 'email', 'user_photos'])
        .then((result) => {
          if (!result.isCancelled) {
            console.log(`Login success with permissions: ${result.grantedPermissions.toString()}`);
                // get the access token
            return AccessToken.getCurrentAccessToken();
          }
          return null;
        })
        .then(data => {
          if (data) {
                // create a new firebase credential with the token
            this.setState({ isLoading: true });
            const responseInfoCallback = (error, result) => {
              if (error) {
                console.log(error.toString());
              } else {
                console.log('=====Get high pixel image=====', JSON.stringify(result));
                const credential = firebase.auth.FacebookAuthProvider.credential(data.accessToken);
                AsyncStorage.setItem('credential', JSON.stringify(credential), () => {

                });
                // login with credential
                firebase.auth().signInWithCredential(credential)
                .then((currentUser) => {
                  if (currentUser) {
                    console.log('Facebook_user', currentUser);
                    this.props.setUserInfo(currentUser, result.picture.data.url, () => {
                      this.setState({ isLoading: false });
                      this.onLoginSuccess();
                    });
                  }
                })
                .catch((e) => {
                  this.setState({ isLoading: false });
                  console.log(`Login fail with error: ${e}`);
                });
              }
            };

            const infoRequest = new GraphRequest(
              '/me',
              {
                accessToken: data.accessToken,
                parameters: {
                  fields: {
                    string: 'picture.width(300).height(300)',
                  },
                },
              },
              responseInfoCallback
            );
            new GraphRequestManager().addRequest(infoRequest).start();
          }
        });
  }

  normalAuth() {
    this.props.navigation.navigate('normal_auth');
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Image source={logo} style={{ flex: 1, resizeMode: 'contain' }} />
          <View>
            <TouchableOpacity style={styles.button} onPress={() => this.normalAuth()}>
              <Icon name="md-mail" style={styles.icon} />
              <Text style={styles.buttonText}>Login with Email Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => this.onFacebookLogin()}>
              <Icon name="logo-facebook" style={styles.icon} />
              <Text style={styles.buttonText}>Auth with Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => this.onGoogleLogin()}>
              <Icon name="logo-googleplus" style={styles.icon} />
              <Text style={styles.buttonText}>Auth with Google+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CustomLoadingView visible={this.state.isLoading} color={Color.red} />
      </View>
    );
  }
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators(ActionCreators, dispatch);
}
export default connect((state) => ({
  appState: state.appState,
}), mapDispatchToProps)(Login);
