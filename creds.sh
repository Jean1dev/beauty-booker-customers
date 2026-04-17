npm install -g eas-cli

eas credentials
eas build --platform android --profile production
eas build --platform android --profile preview

eas build --platform ios --profile production
eas build --platform ios --profile preview

npx expo prebuild --platform android --clean

eas submit

eas secret:create \
  --name GOOGLE_SERVICES_PLIST \
  --type file \
  --value ./GoogleService-Info.plist