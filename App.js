import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import * as Location from "expo-location";

const ZOOM_LEVEL = 15;
const ANIMATION_DURATION = 2000;

export default function App() {
  const mapRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function getCurrentLocation() {
      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          throw new Error("Location permission denied");
        }

        const location = await Location.getCurrentPositionAsync({});

        if (!isMounted) {
          return;
        }

        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(coordinates);

        mapRef.current?.animateCamera(
          {
            center: coordinates,
            zoom: ZOOM_LEVEL,
          },
          { duration: ANIMATION_DURATION }
        );
      } catch {
        if (isMounted) {
          setError("Permission to access location was denied");
        }
      }
    }

    getCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  function centerOnCoordinates(coordinates) {
    mapRef.current?.animateCamera(
      {
        center: coordinates,
        zoom: ZOOM_LEVEL,
      },
      { duration: ANIMATION_DURATION }
    );
  }

  async function addMarker() {
    Keyboard.dismiss();
    setError("");

    if (!address.trim()) {
      setMarker(null);
      setError("Address not found");
      return;
    }

    try {
      const results = await Location.geocodeAsync(address.trim());

      if (!results || results.length === 0) {
        setMarker(null);
        setError("Address not found");
        return;
      }

      const coordinates = {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };

      setMarker(coordinates);
      centerOnCoordinates(coordinates);
    } catch {
      setMarker(null);
      setError("Address not found");
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: currentLocation?.latitude ?? 0,
          longitude: currentLocation?.longitude ?? 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title="Selected address"
            testID="selected-marker"
          />
        )}

        {currentLocation && marker && (
          <Polyline
            coordinates={[currentLocation, marker]}
            strokeColor="#2675D8"
            strokeWidth={3}
            testID="selected-polyline"
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <TextInput
          style={styles.input}
          placeholder="Enter the address"
          value={address}
          onChangeText={setAddress}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={addMarker}
        />

        <Pressable
          style={styles.button}
          onPress={addMarker}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Add marker</Text>
        </Pressable>

        {marker && (
          <Pressable
            style={styles.button}
            onPress={() => centerOnCoordinates(marker)}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Center the marker</Text>
          </Pressable>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#BBBBBB",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2675D8",
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#C62828",
    fontSize: 14,
    marginTop: 4,
  },
});