## Run dev

- Update .env files
- Install packages and run

```bash
npm install
npm run dev
```

- Disable firewall if it is not accessible

```bash
sudo firewall-cmd --permanent --remove-port=8081/udp
sudo firewall-cmd --permanent --remove-port=8081/tcp
```

## Building the apk

### Build on server on latest local commit

```bash
# build on expo and get AAB file
eas build --platform android
```

### Local Build Setup

Ref: https://stackoverflow.com/questions/47438857/how-to-build-expo-apk-local

If you don’t want Android Studio, you can download just the SDK tools:

    Download the "Command Line Tools" from:
    → https://developer.android.com/tools
    (Look for "Command line tools only")

    Extract the ZIP to a folder (e.g., ~/android-sdk).

    Run the SDK Manager to install packages:


## Set ANDROID_HOME in your environment:
```bash
export ANDROID_HOME=~/android-sdk # sdk location
export ANDROID_HOME=~/Downloads/cmdline-tools # sdk location
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk # java 17 required
```

```bash

cd $ANDROID_HOME/cmdline-tools/bin
./sdkmanager --list

./sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" # --sdk_root=../
## (Replace android-33 with your target API level....35)

# extra commands
./sdkmanager --install "ndk;26.1.10909125" --sdk_root=../
./sdkmanager "platforms;android-35" --sdk_root=../

eas build --platform android --local
```

#### or

```bash
npx sentry-cli login

npx expo run:android --variant release
```

### Generating Apk from AAB file

Create key with some password

```bash
## alias_name, my-release-key.keystore
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
password: hhhhhh
```

```bash
java -jar bundletool-all-1.18.1.jar build-apks --bundle=application-9eb7cec7-ae03-49be-94f8-e985c2b0fbdd.aab --output=aquago.apks --ks my-release-key.keystore --ks-key-alias alias_name

java -jar ../bundletool-all-1.18.1.jar build-apks --apks aquago.apks

# or

java -jar ../bundletool-all-1.18.1.jar build-apks --bundle=application-9eb7cec7-ae03-49be-94f8-e985c2b0fbdd.aab --output=aquago.apks --mode=universal --ks ../my-release-key.keystore --ks-key-alias alias_name

unzip app.apks
```

### Installing apks

ref: https://stackoverflow.com/questions/53040047/generate-an-apk-file-from-an-aab-file-android-app-bundle

```bash
# build apks according to connected device
java -jar ../script/bundletool-all-1.18.1.jar build-apks --bundle=application.aab --output=aqua.apks --connected-device

# Install on connected device
java -jar ../script/bundletool-all-1.18.1.jar install-apks --apks=aqua.apks
```

# TODO: add
NODE_ENV=production

### other installations
sudo dnf isntall qemu-system-x86_64
https://www.reddit.com/r/Fedora/comments/18s1z94/have_any_of_you_in_wayland_fedora_39_had_issues/

