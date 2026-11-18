Pod::Spec.new do |s|
  s.name           = 'PlaceSearch'
  s.version        = '1.0.0'
  s.summary        = 'Apple MapKit place autocomplete for the map search bar'
  s.description    = 'Wraps MKLocalSearchCompleter and MKLocalSearch for the map search bar.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'MapKit'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = "**/*.{h,m,swift}"
end
