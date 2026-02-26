package com.example.agent_rnd;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println(encoder.encode("1234"));
    }
}
