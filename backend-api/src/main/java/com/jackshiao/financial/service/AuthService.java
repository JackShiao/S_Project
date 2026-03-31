package com.jackshiao.financial.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jackshiao.financial.dto.RegisterRequest;
import com.jackshiao.financial.entity.Member;
import com.jackshiao.financial.entity.Role;
import com.jackshiao.financial.repository.MemberRepository;
import com.jackshiao.financial.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void register(RegisterRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("信箱已被註冊");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        Role role = roleRepository.findByRoleName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("找不到預設角色 ROLE_USER，請確認資料庫初始資料。"));

        Member member = Member.builder()
                .email(request.getEmail())
                .passwordHash(encodedPassword)
                .displayName(request.getUsername())
                .createdAt(LocalDateTime.now())
                .build();

        member.getRoles().add(role);

        memberRepository.save(member);
    }
}
