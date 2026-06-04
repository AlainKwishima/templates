package com.example.ims.controller;

import com.example.ims.dto.ResourceDto;
import com.example.ims.service.ResourceService;
import com.example.ims.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceDto>> createResource(@Valid @RequestBody ResourceDto request) {
        return ResponseEntity.ok(ApiResponse.success("Resource created successfully", resourceService.createResource(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDto>> updateResource(@PathVariable Long id, @Valid @RequestBody ResourceDto request) {
        return ResponseEntity.ok(ApiResponse.success("Resource updated successfully", resourceService.updateResource(id, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDto>> getResource(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Resource fetched successfully", resourceService.getResourceById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceDto>>> getAllResources() {
        return ResponseEntity.ok(ApiResponse.success("Resources fetched successfully", resourceService.getAllResources()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", null));
    }
}
