package com.example.ims.service;

import com.example.ims.dto.ResourceDto;
import java.util.List;

public interface ResourceService {
    ResourceDto createResource(ResourceDto request);
    ResourceDto updateResource(Long id, ResourceDto request);
    ResourceDto getResourceById(Long id);
    List<ResourceDto> getAllResources();
    void deleteResource(Long id);
}
