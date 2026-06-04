package com.example.ims.service.impl;

import com.example.ims.dto.ResourceDto;
import com.example.ims.entity.Department;
import com.example.ims.entity.Resource;
import com.example.ims.exception.AppValidationException;
import com.example.ims.exception.ResourceNotFoundException;
import com.example.ims.mapper.ResourceMapper;
import com.example.ims.repository.DepartmentRepository;
import com.example.ims.repository.ResourceRepository;
import com.example.ims.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final DepartmentRepository departmentRepository;
    private final ResourceMapper resourceMapper;

    @Override
    public ResourceDto createResource(ResourceDto request) {
        if (resourceRepository.existsByCode(request.code())) {
            throw new AppValidationException("Resource code already exists");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        Resource resource = Resource.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .status(request.status())
                .department(department)
                .build();

        return resourceMapper.toDto(resourceRepository.save(resource));
    }

    @Override
    public ResourceDto updateResource(Long id, ResourceDto request) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        if (!resource.getCode().equals(request.code()) && resourceRepository.existsByCode(request.code())) {
            throw new AppValidationException("Resource code already exists");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));

        resource.setName(request.name());
        resource.setCode(request.code());
        resource.setDescription(request.description());
        resource.setStatus(request.status());
        resource.setDepartment(department);

        return resourceMapper.toDto(resourceRepository.save(resource));
    }

    @Override
    public ResourceDto getResourceById(Long id) {
        return resourceRepository.findById(id)
                .map(resourceMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));
    }

    @Override
    public List<ResourceDto> getAllResources() {
        return resourceRepository.findAll().stream()
                .map(resourceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found");
        }
        resourceRepository.deleteById(id);
    }
}
