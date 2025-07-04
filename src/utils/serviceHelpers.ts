
export const getServiceTags = (service, allTags) => {
  if (!service.tag_ids || !Array.isArray(service.tag_ids)) return [];
  return allTags.filter(tag => service.tag_ids.includes(tag.id));
};

export const getServiceWindows = (serviceId, allWindows) => {
  return allWindows.filter(window => window.service_id === serviceId);
};
