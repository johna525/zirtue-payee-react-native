import React, { Component } from 'react';
import { StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Container, Content } from 'native-base';
import Toast from 'react-native-simple-toast';
import dismissKeyboard from 'react-native-dismiss-keyboard';

import { Color } from '../../lib/color';
import { ActionCreators } from '../../redux/action';
import CustomInput from '../../component/textInput';
import CustomButton from '../../component/button';
import CustomHeader from '../../component/header';
import CustomLoadingView from '../../component/loading';
import { dySize } from '../../lib/responsive';
import * as Language from '../../lib/language';
import * as Service from '../../lib/service';

const styles = StyleSheet.create({
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  toggleView: {
    width: dySize(200),
    padding: 6,
    backgroundColor: Color.lightgray,
    flexDirection: 'row',
    borderRadius: 6,
  },
  toggleButtonView: {
    flex: 1,
    width: dySize(100),
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});

export class NormalAuth extends Component {

  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirm: '',
      toggle: 'signin',
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  checkValidation() {
    const { toggle, firstName, lastName, password, email, confirm } = this.state;
    if (toggle === 'signin') {
      if (!this.validateEmail(email)) {
        Toast.show(Language.normalAuth.invalid_email);
        return false;
      } else if (password.length === 0) {
        Toast.show(Language.normalAuth.invalid_password);
        return false;
      }
    } else {
      if (firstName.length === 0) {
        Toast.show('First Name is empty');
        return false;
      } else if (lastName.length === 0) {
        Toast.show('Last Name is empty');
        return false;
      } else if (!this.validateEmail(email)) {
        Toast.show('Invalid Email');
        return false;
      } else if (password.length < 8) {
        Toast.show('Password must be over 8 digit in length');
        return false;
      } else if (password !== confirm) {
        Toast.show('Confirm password is incorrect');
        return false;
      }
    }
    return true;
  }

  onSignIn() {
    if (!this.checkValidation()) return;
    this.setState({ isLoading: true });
    Service.signInToServer(this.state.email, this.state.password, (res) => {
      if (res.success) {
        console.log('Logged In on Amazon successfully');
        Service.signInToFirebase(this.state.email, this.state.password, (data) => {
          const currentUser = {
            displayName: res.user.name.en,
            arName: res.user.name.ar,
            email: data.email,
            emailVerified: data.emailVerified,
            providerId: 'Amazon',
            socialUserId: res.user._id,
            uid: data.uid,
          };
          console.log(currentUser);
          this.props.setUserInfo(currentUser, '', () => {
            console.log('Saved user data successfully');
            this.setState({ isLoading: false });
            this.onLoginSuccess();
          });
        });
      } else {
        Service.showAlert(res.message);
        this.setState({ isLoading: false });
      }
    });
  }

  onLoginSuccess() {
    dismissKeyboard();
    this.props.navigation.navigate('home', { index: 3 });
  }

  onSignUp() {
    if (!this.checkValidation()) return;
    Service.signUpToServer(this.state.email, this.state.password, (res) => {
      if (res.success) {
        Service.signUpToFirebase(this.state.email, this.state.password, (data) => {
          Service.showAlert(JSON.stringify(data));
        });
      }
    });
  }

  render() {
    const { toggle, firstName, lastName, password, email, confirm } = this.state;
    return (
      <Container>
        <CustomHeader
          left="ios-arrow-back"
          onPressLeft={() => this.props.navigation.goBack()}
        />
        {
          toggle === 'signup' ?
            <Content contentContainerStyle={styles.content}>
              <CustomInput
                label="First Name"
                width={dySize(300)}
                text={firstName}
                onChange={text => this.setState({ firstName: text })}
              />
              <CustomInput
                label="Last Name"
                width={dySize(300)}
                text={lastName}
                onChange={text => this.setState({ lastName: text })}
              />
              <CustomInput
                label="Email"
                width={dySize(300)}
                text={email}
                keyboardType="email-address"
                onChange={text => this.setState({ email: text })}
              />
              <CustomInput
                label="Password"
                width={dySize(300)}
                text={password}
                onChange={text => this.setState({ password: text })}
              />
              <CustomInput
                label="Confirm Password"
                width={dySize(300)}
                text={confirm}
                onChange={text => this.setState({ confirm: text })}
              />
              <CustomButton
                backgroundColor={Color.blue}
                text="Sign Up"
                onPress={this.onSignUp.bind(this)}
              />
            </Content>
          :
            <Content contentContainerStyle={styles.content}>
              <CustomInput
                label={Language.normalAuth.email}
                width={dySize(300)}
                text={email}
                keyboardType="email-address"
                onChange={text => this.setState({ email: text })}
              />
              <CustomInput
                label={Language.normalAuth.password}
                width={dySize(300)}
                text={password}
                onChange={text => this.setState({ password: text })}
              />
              <CustomButton
                backgroundColor={Color.blue}
                text={Language.normalAuth.signin}
                onPress={this.onSignIn.bind(this)}
              />
            </Content>
        }

        <CustomLoadingView color={Color.blue} visible={this.state.isLoading} />
      </Container>
    );
  }
}


function mapDispatchToProps(dispatch) {
  return bindActionCreators(ActionCreators, dispatch);
}
export default connect((state) => {
  return {
    userInfo: state.userInfo,
    myBadge: state.myBadge,
  };
}, mapDispatchToProps)(NormalAuth);
