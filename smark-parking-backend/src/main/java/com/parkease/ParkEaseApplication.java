package com.parkease;

import org.springframework.boot.SpringApplication;


import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.web.bind.annotation.CrossOrigin;


import io.github.cdimascio.dotenv.Dotenv;
@SpringBootApplication
// CORS handled by SecurityConfig
@EnableJpaRepositories(basePackages = "com.parkease.dao")

@EntityScan(basePackages = "com.parkease.beans")
public class ParkEaseApplication {

	public static void main(String[] args) {
		   Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
	        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(ParkEaseApplication.class, args);
	}

}
