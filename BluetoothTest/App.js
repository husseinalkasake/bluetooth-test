/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TextInput,
  PermissionsAndroid,
  Button,
  TouchableOpacity,
} from 'react-native';
import {BleManager} from 'react-native-ble-plx';

import {Colors} from 'react-native/Libraries/NewAppScreen';

const requestLocationPermission = async () => {
  let isGranted = false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'The App needs location access for Bluetooth to work',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location Permission Given');
      isGranted = true;
    } else {
      console.log('Location Permission Denied');
    }
  } catch (err) {
    console.warn(err);
  }
  return isGranted;
};

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.manager = new BleManager();
    this.state = {
      name: '',
      id: '',
      locationAccessGranted: false,
      characteristicsForEachService: [
        [
          {
            serviceUUID: 'serviceUUID1',
            uuid: 'characteristicUUID1',
            isWritableWithResponse: true,
          },
        ],
        [
          {
            serviceUUID: 'serviceUUID2',
            uuid: 'characteristicUUID2',
            isWritableWithResponse: false,
          },
        ],
      ],
      currentCharacteristic: null,
      valueToSend: null,
    };
  }

  async componentDidMount() {
    const locationAccessGranted = await requestLocationPermission();
    this.setState({locationAccessGranted});
  }

  startScan() {
    if (!this.state.locationAccessGranted) return;
    const subscription = this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        this.scanAndConnect();
        subscription.remove();
      }
    }, true);
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
        this.setState({error: 'Failed to Scan'});
        return;
      }

      // Check if it is a device you are looking for based on advertisement data
      // or other criteria.
      if (
        device.id === this.state.id ||
        device.name === this.state.name ||
        !!device.id
      ) {
        // Stop scanning as it's not necessary if you are scanning for one device.
        this.manager.stopDeviceScan();
        debugger;

        // Proceed with connection.
        device
          .connect()
          .then((device) => device.discoverAllServicesAndCharacteristics())
          .then((device) => device.services())
          .then((services) =>
            Promise.all(services.map((service) => service.characteristics())),
          )
          .then((characteristicsForEachService) => {
            debugger;
            this.setState({characteristicsForEachService, error: ''});
          })
          .catch((error) => {
            console.log(error);
            this.setState({error: 'Failed to Connect'});
          });
      }
    });
  }

  showSendValueWindow(currentCharacteristic) {
    debugger;
    this.setState({currentCharacteristic});
  }

  sendValue() {
    debugger;
    this.state.currentCharacteristic
      .writeWithResponse(Number(this.state.valueToSend))
      .then((result) => {
        console.log(result);
        this.setState({currentCharacteristic: null});
      });
  }

  render() {
    const {
      id,
      name,
      characteristicsForEachService,
      currentCharacteristic,
      valueToSend,
    } = this.state;
    const scanButtonEnabled = id !== '' || name !== '';
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}>
            <View style={styles.body}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Bluetooth Test 🦞</Text>
                <Text style={styles.sectionDescription}>
                  Enter ID or Name of Bluetooth Device and start scan:
                </Text>
                <TextInput
                  placeholder="ID"
                  value={id}
                  onChangeText={(id) => this.setState({id})}
                />
                <TextInput
                  placeholder="Name"
                  value={name}
                  onChangeText={(name) => this.setState({name})}
                />
                <TouchableOpacity
                  style={{
                    ...styles.scanButton,
                    backgroundColor: scanButtonEnabled ? '#1387C4' : '#808080',
                  }}
                  disabled={!scanButtonEnabled}
                  onPress={() => this.startScan()}>
                  <Text style={styles.scanButtonText}>Start Scan</Text>
                </TouchableOpacity>
                <ScrollView>
                  {characteristicsForEachService.map((characteristics) => {
                    return (
                      <View key={characteristics[0]?.serviceUUID}>
                        <Text
                          style={{
                            backgroundColor: Colors.black,
                            color: Colors.white,
                            paddingVertical: 5,
                            paddingLeft: 8,
                          }}>
                          {'Service UUID: ' + characteristics[0]?.serviceUUID}
                        </Text>
                        {characteristics.map((characteristic) => {
                          return (
                            <Text
                              key={characteristic.uuid}
                              onPress={() =>
                                characteristic.isWritableWithResponse &&
                                this.showSendValueWindow(characteristic)
                              }
                              style={{
                                paddingVertical: 5,
                                paddingLeft: 8,
                                backgroundColor: characteristic.isWritableWithResponse
                                  ? '#32a852'
                                  : '#FFFFFF',
                              }}>
                              {'Characteristic UUID: ' + characteristic.uuid}
                            </Text>
                          );
                        })}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
          {!!currentCharacteristic && (
            <View style={styles.sendValuePopup}>
              <View style={styles.sendValuePopupInnerContainer}>
                <Text style={styles.scanButton}>
                  {'Service UUID: ' + currentCharacteristic?.serviceUUID}
                </Text>
                <Text style={styles.scanButton}>
                  {'Characteristic UUID: ' + currentCharacteristic?.uuid}
                </Text>
                <TextInput
                  placeholder="Value to Send"
                  value={valueToSend}
                  style={styles.scanButton}
                  onChangeText={(valueToSend) => this.setState({valueToSend})}
                />
                <Button
                  title="Send Value"
                  onPress={() => !!valueToSend && this.sendValue()}
                />
                <Button
                  title="Cancel"
                  onPress={() => this.setState({currentCharacteristic: null})}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  scanButton: {
    paddingVertical: 10,
    marginVertical: 2,
  },
  scanButtonText: {
    paddingLeft: 8,
    fontWeight: 'bold',
    color: Colors.white,
  },
  sendValuePopup: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendValuePopupInnerContainer: {
    width: '80%',
    // height: '50%',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
