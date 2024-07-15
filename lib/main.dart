import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1C2535),
        ),
        body: Container(
          color: const Color(0xFF1C2535),
          child: Align(
            alignment: Alignment.topLeft,
            child:
            Padding(padding: EdgeInsets.only(left:16.0,right:16.0,top:60),
              child:Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                    Text("Log in",
                    style:GoogleFonts.montserrat(
                      color:Colors.white,
                      fontSize: 30,
                    ),

                    ),
                  const SizedBox(height: 46.0),
                  const TextField(
                    decoration: const InputDecoration(
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color:Color(0xFFF4A00F),width:2.0)
                      ),
                      hintText: 'Phone',
                      hintStyle: TextStyle(
                        color: Colors.white,
                        fontSize: 16.0,
                        fontFamily: 'Montserrat',
                        fontWeight: FontWeight.bold,


                      )
                    ),
                  ),
                const SizedBox(height:60),
                  const TextField(
                    decoration: InputDecoration(
                      enabledBorder: OutlineInputBorder(
                       borderSide: BorderSide(color:Color(0xFFF4A00F),
                       width:2.0)
                      ),
                        hintText: 'Password',
                        hintStyle: TextStyle(
                          color: Colors.white,
                          fontSize: 16.0,
                          fontFamily: 'Montserrat',
                          fontWeight: FontWeight.bold,

                        )
                    ),
                  ),
                  const SizedBox(height:60),
                  Text("Log in with OTP",
                    style:GoogleFonts.montserrat(
                      color:Colors.white,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height:60),
                  Center(child:ElevatedButton(
                    onPressed: () {
                      // Add your onPressed code here!
                      print('Button Pressed');
                    },
                    style: ElevatedButton.styleFrom(
                      foregroundColor: Colors.white,

                      backgroundColor: const Color(0xFFF4A00F),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8.0)
                      ),
                      textStyle: GoogleFonts.montserrat(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    child: const Text('Login'),
                  ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

