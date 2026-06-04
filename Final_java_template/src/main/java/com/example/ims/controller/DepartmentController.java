package com.example.ims.controller;

import com.example.ims.dto.DepartmentDto;
import com.example.ims.service.DepartmentService;
import com.example.ims.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentDto>> createDepartment(@Valid @RequestBody DepartmentDto request) {
        return ResponseEntity.ok(ApiResponse.success("Department created successfully", departmentService.createDepartment(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentDto>> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDto request) {
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", departmentService.updateDepartment(id, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentDto>> getDepartment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Department fetched successfully", departmentService.getDepartmentById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success("Departments fetched successfully", departmentService.getAllDepartments()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}
