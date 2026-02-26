package com.example.agent_rnd.security;

import com.example.agent_rnd.repository.UserRepository;
import com.example.agent_rnd.service.LogoutService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final LogoutService logoutService;

    public SecurityConfig(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            LogoutService logoutService
    ) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.logoutService = logoutService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        JwtAuthenticationFilter jwtFilter =
                new JwtAuthenticationFilter(jwtTokenProvider, userRepository, logoutService);

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 🔓 누구나 접근 가능
                        .requestMatchers(
                                "/",
                                "/error",
                                "/favicon.ico",
                                "/api/auth/**",
                                "/api/login",
                                "/api/check-email",
                                "/api/send-code",
                                "/api/verify-email-code",
                                "/api/invites/validate",
                                "/api/payments/webhook",
                                "/collect/**",
                                "/parse/**"
                        ).permitAll()

                        // ✅ 공고 조회는 공개 (리스트/상세 등 GET만)
                        .requestMatchers(HttpMethod.GET, "/api/notices/**").permitAll()

                        // ✅ Step2(유관 RFP 검색) : 로그인 필수
                        .requestMatchers(HttpMethod.POST, "/api/notices/*/search-rfp").authenticated()

                        // (선택) Step1/3/4도 로그인 필요로 하고 싶으면 아래처럼 추가
                        .requestMatchers(HttpMethod.POST, "/api/notices/*/analyze").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notices/*/generate-ppt").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notices/*/generate-script").authenticated()

                        // 🔐 로그인한 사용자 접근 가능
                        .requestMatchers("/api/users/me").authenticated()

                        // 🔒 관리자 전용
                        .requestMatchers("/api/admin/**", "/api/users/**")
                        .hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "https://randiaivle.duckdns.org",
                "http://randiaivle.duckdns.org",
                "https://16.184.16.236",
                "http://16.184.16.236",
                "https://ec2-16-184-16-236.ap-northeast-2.compute.amazonaws.com",
                "http://ec2-16-184-16-236.ap-northeast-2.compute.amazonaws.com",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174"
        ));

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
