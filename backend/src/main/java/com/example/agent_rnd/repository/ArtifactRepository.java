package com.example.agent_rnd.repository;

import com.example.agent_rnd.domain.artifact.Artifact;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtifactRepository extends JpaRepository<Artifact, Long> {
}