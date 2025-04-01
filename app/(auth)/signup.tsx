import { useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSignUp = async () => {
    try {
      // Validate input fields
      if (!email || !password || !name) {
        const errorMsg = 'Please fill in all fields';
        console.error('[Signup Error]:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const errorMsg = 'Please enter a valid email address';
        console.error('[Signup Error]:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters long';
        console.error('[Signup Error]:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('[Signup Process]:', 'Starting signup for email:', email);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('[Signup Error]:', signUpError.message);
        setError(signUpError.message);
        return;
      }

      if (signUpData?.user) {
        console.log('[Signup Success]:', 'User created successfully', {
          userId: signUpData.user.id,
          email: signUpData.user.email
        });

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: signUpData.user.id,
              email: email,
              name: name,
            },
          ]);

        if (profileError) {
          console.error('[Profile Creation Error]:', profileError.message);
          setError('Account created but profile setup failed. Please contact support.');
          return;
        }

        console.log('[Profile Creation Success]:', 'User profile created successfully');
        router.replace('/(tabs)');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('[Signup Error]:', errorMsg);
      setError(errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Create Account</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.signupButtonText}>SIGN UP</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    padding: 20,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 30,
  },
  errorText: {
    color: '#FF3B30',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },
  signupButton: {
    backgroundColor: '#FFA500',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  loginLink: {
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
  },
});