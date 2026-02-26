package com.example.agent_rnd.controller;

import com.example.agent_rnd.dto.auth.LoginRequest;
import com.example.agent_rnd.dto.auth.LoginResponse;
import com.example.agent_rnd.service.LoginService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/login")
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @PostMapping
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(loginService.login(request));
    }
}
