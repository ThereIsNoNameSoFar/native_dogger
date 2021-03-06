import * as React from 'react';
import { Animated, Dimensions, Button, Image,
   View, Keyboard, TextInput, UIManager, StyleSheet, Alert} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import { Icon } from 'react-native-elements'
import {uploadDogRequest} from '../DoggerRestApi'
import DogToUpload from '../DogToUpload';

const config = require('../config');

const { State: TextInputState } = TextInput;

export default class AddDog extends React.Component {
  state = {
    image: null,
    shift: new Animated.Value(0),
    dogInfo: undefined,
    dogName: undefined,
    uploading: false,
  };

  constructor(props)
  {
    super(props)

    this.uploadDog = this.uploadDog.bind(this)
  }

  componentDidMount() {
    this.getPermissionAsync();
    
    this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
    this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardDidShowSub.remove();
    this.keyboardDidHideSub.remove();
  }

  render() {
    let { image } = this.state;
    return (
      <Animated.View style={{transform: [{translateY: this.state.shift}], flex: 1, width: "100%", alignItems: 'center', justifyContent: 'flex-start' }}>
        <View style={{width: "100%", height: "50%", marginBottom: 20, alignItems: 'center', justifyContent: 'center'}}>
          {
            image ?
            <Image source={{ uri: image }} style={{width: "100%", height: "100%", resizeMode: 'cover', borderRadius: 0,}} /> :
            <View style={{
              width: "70%", 
              height: "70%", 
              borderColor: "grey", 
              borderWidth: 6,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name='image' type='font-awesome' color='grey' size={100}/>
            </View>
          }
        </View>
        <Button
          title="Pick a dog image"
          onPress={this._pickImage}
        />
        <TextInput
          style={styles.textInput}
          placeholder='DOG NAME'
          maxLength={15}
          value={this.state.dogName?this.state.dogName:''}
          onChangeText={text => {this.setState({dogName: text})}}
        />
        <TextInput
          multiline
          numberOfLines={2}
          style={styles.infoInput}
          editable
          maxLength={50}
          placeholder='DOG INFO'
          value={this.state.dogInfo?this.state.dogInfo:''}
          onChangeText={text => {
            if(text.split('\n').length < 4)
            {
              this.setState({dogInfo: text})
            }
          }}
        />
        <View 
          style={styles.uploadButton}
        >
          <Button
            disabled={this.state.uploading || !(this.state.dogName && this.state.dogInfo && this.state.image)}
            title="Upload the dog"
            onPress={this.uploadDog}
          />
        </View>
      </Animated.View>
    );
  }

  uploadDog(){
    let dogToUpload = new DogToUpload(this.state.dogName, this.state.dogInfo, this.state.image);
    this.setState({uploading: true});
    onSuccess = onSuccess.bind(this);
    onFailure = onFailure.bind(this);

    function onSuccess() {
      this.props.closeModalMethod()
      Alert.alert(
        'Uploaded Dog',
        'Successfully uploaded the dog!',
        [
          {text: 'OK', onPress: () => {}},
        ],
        {cancelable: false},
      );
    }
    
    function onFailure(responseJson) {
      if(responseJson && responseJson.status) {
        Alert.alert(
          'Failed Uploading',
          responseJson.status.errorMessege,
          [
            {text: 'OK', onPress: () => {}},
          ],
          {cancelable: false},
        );
      }
      this.setState({uploading: false})
    }

    uploadDogRequest(dogToUpload, onSuccess, onFailure);
  }

  handleKeyboardDidShow = (event) => {
    const { height: windowHeight } = Dimensions.get('window');
    const keyboardHeight = event.endCoordinates.height;
    const currentlyFocusedField = TextInputState.currentlyFocusedField();
    UIManager.measure(currentlyFocusedField, (originX, originY, width, height, pageX, pageY) => {
      const fieldHeight = height;
      const fieldTop = pageY;
      const gap = (windowHeight - keyboardHeight) - (fieldTop + fieldHeight);
      if (gap >= 0) {
        return;
      }
      Animated.timing(
        this.state.shift,
        {
          toValue: gap,
          duration: 1000,
          useNativeDriver: true,
        }
      ).start();
    });
  }

  handleKeyboardDidHide = () => {
    Animated.timing(
      this.state.shift,
      {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }
    ).start();
  }

  getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Image,
      allowsEditing: true,
      quality: 1,
      base64: false,
      exif: true
    });

    console.log(result)

    if (!result.cancelled) {
      this.setState({ image: result.uri });
    }
  };
}

const styles = StyleSheet.create({
  textInput: {
    marginTop: 10,
    color: "#fff",
    fontSize: 18,
    borderBottomColor: "grey",
    borderBottomWidth: 1,
    height: 40,
    minWidth: "50%",
  }, 
  infoInput: {
    textAlignVertical: 'top',
    marginTop: 20,
    padding: 5,
    color: "#fff",
    fontSize: 15,
    borderColor: "grey",
    borderWidth: 1,
    height: 80,
    width: "70%",
  },
  uploadButton: {
    marginTop: 20,
    width: "50%",
  }
});