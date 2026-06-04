package com.example.ims.service.impl;

import com.example.ims.dto.DepartmentDto;
import com.example.ims.entity.Department;
import com.example.ims.exception.AppValidationException;
import com.example.ims.exception.ResourceNotFoundException;
import com.example.ims.mapper.DepartmentMapper;
import com.example.ims.repository.DepartmentRepository;
import com.example.ims.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentMapper departmentMapper;

    @Override
    public DepartmentDto createDepartment(DepartmentDto request) {
        if (departmentRepository.existsByName(request.name())) {
            throw new AppValidationException("Department name already exists");
        }
        Department department = departmentMapper.toEntity(request);
        return departmentMapper.toDto(departmentRepository.save(department));
    }

    @Override
    public DepartmentDto updateDepartment(Long id, DepartmentDto request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        
        if (!department.getName().equals(request.name()) && departmentRepository.existsByName(request.name())) {
            throw new AppValidationException("Department name already exists");
        }

        department.setName(request.name());
        department.setDescription(request.description());
        return departmentMapper.toDto(departmentRepository.save(department));
    }

    @Override
    public DepartmentDto getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .map(departmentMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    @Override
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found");
        }
        departmentRepository.deleteById(id);
    }
}
