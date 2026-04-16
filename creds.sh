npm install -g eas-cli

eas credentials
eas build --platform android --profile production
eas build --platform android --profile preview

eas build --platform ios --profile production
eas build --platform ios --profile preview

eas submit