package com.example.ims.service;

import com.example.ims.dto.DepartmentDto;
import java.util.List;

public interface DepartmentService {
    DepartmentDto createDepartment(DepartmentDto request);
    DepartmentDto updateDepartment(Long id, DepartmentDto request);
    DepartmentDto getDepartmentById(Long id);
    List<DepartmentDto> getAllDepartments();
    void deleteDepartment(Long id);
}
