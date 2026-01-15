'use client';

import ConfirmationModal from '@/components/forms/ConfirmationModal';
import { SelectWithClassName } from '@/components/forms/selectWithClassName';
import {
  GlobalSetting,
  useCreateGlobalSetting,
  useGlobalSettings,
  useSoftDeleteGlobalSetting,
  useUpdateGlobalSetting,
} from '@/hooks/api/use-global-setting';
import {
  addToast,
  Button,
  Card,
  CardBody,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  SelectItem,
  DrawerFooter,
} from '@heroui/react';
import { useState } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

export function GlobalSettingsTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }>({
    search: undefined,
    sortBy: undefined,
    sortOrder: undefined,
    page: undefined,
    limit: undefined,
  });
  const { data: globalSettingsData, isLoading } = useGlobalSettings({
    search: search || undefined,
    sortBy: filter.sortBy || undefined,
    sortOrder: filter.sortOrder || undefined,
    page: filter.page || undefined,
    limit: filter.limit || undefined,
  });
  const [formData, setFormData] = useState({
    id: '',
    config_key: '',
    config_value: {},
    created_at: '',
    updated_at: '',
  });
  const [customConfigValueInput, setCustomConfigValueInput] = useState<{
    key: string;
    value: string;
  }>({ key: '', value: '' });
  const createGlobalSetting = useCreateGlobalSetting();
  const updateGlobalSetting = useUpdateGlobalSetting();
  const deletePage = useSoftDeleteGlobalSetting();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string>('');

  const handleEdit = (id: string) => {
    const setting = globalSettingsData?.data?.find((setting) => setting.id === id);
    if (setting) {
      setFormData({
        id: setting.id!,
        config_key: setting.config_key,
        config_value: setting.config_value,
        created_at: setting.created_at,
        updated_at: setting.updated_at,
      });
      setModalMode('edit');
    }
  };

  const handleUpsert = async () => {
    try {
      if (modalMode === 'create') {
        await createGlobalSetting.mutateAsync({
          config_key: formData.config_key,
          config_value: formData.config_value
        },{
          onSuccess: () => {
            addToast({ title: 'Global setting created successfully', color: 'success' });
            setFormData({
              id: '',
              config_key: '',
              config_value: {},
              created_at: '',
              updated_at: '',
            });
            setModalMode(null);
          },
          onError: (error) => {
            addToast({ title: 'Failed to create global setting', color: 'danger' });
          },
        }
      );
      } else {
        await updateGlobalSetting.mutateAsync({
          id: formData.id,
          data: {
            key: formData.config_key,
            data: formData.config_value
          }
        },{
          onSuccess: () => {
            addToast({ title: 'Global setting updated successfully', color: 'success' });
            setModalMode(null);
          },
          onError: (error) => {
            addToast({ title: 'Failed to update global setting', color: 'danger' });
          },
        })
      }
    } catch (error) {
      addToast({ title: 'Failed to update global setting', color: 'danger' });
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await deletePage.mutateAsync(slug);
      addToast({ title: 'Global setting deleted successfully', color: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete global setting', color: 'danger' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <Input
          placeholder="Search global settings..."
          value={search}
          onValueChange={setSearch}
          startContent={<FiSearch className="text-text" />}
          classNames={{
            inputWrapper:
              'border-2 border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-backgroundSecondary data-[hover=true]:bg-backgroundSecondary bg-background',
            input: 'text-text group-data-[has-value=true]:text-text',
          }}
          className="flex-1"
        />
        <Button
          color="primary"
          onPress={() => setModalMode('create')}
          startContent={<FiPlus className="text-white" />}
        >
          New Config
        </Button>
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          <Table
            aria-label="Pages table"
            bottomContent={
              <div className="flex justify-center items-center">
                <Pagination
                  total={
                    Math.ceil(
                      (globalSettingsData?.total || 0) / (globalSettingsData?.limit || 10),
                    ) || 0
                  }
                  page={globalSettingsData?.page || 1}
                  onChange={(page) => {
                    setFilter({ ...filter, page: page });
                  }}
                />
              </div>
            }
            removeWrapper
          >
            <TableHeader>
              <TableColumn>Config Key</TableColumn>
              <TableColumn>Config Value</TableColumn>
              <TableColumn width={100} align="center">
                Actions
              </TableColumn>
            </TableHeader>
            <TableBody>
              {globalSettingsData?.data && globalSettingsData.data.length > 0 ? (
                globalSettingsData.data.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="text-text text-sm">{setting.config_key}</TableCell>
                    <TableCell className="text-text">
                      {
                        Object.entries(setting.config_value).slice(0, 3).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-text">{key}: {value}</p>
                          </div>
                        ))
                      }
                      {Object.keys(setting.config_value).length > 3 && (
                        <p className="text-sm text-text-secondary">...</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="primary"
                          onPress={() => handleEdit(setting.id!)}
                        >
                          <FiEdit2 className="text-white" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="danger"
                          onPress={() => setIsDeleteOpen(setting.id!)}
                        >
                          <FiTrash2 className="text-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-text text-center">
                    No global settings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Drawer
        backdrop="blur"
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        size="2xl"
        hideCloseButton
      >
        <DrawerContent className="bg-backgroundSecondary">
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between gap-4">
                <h3 className="text-lg font-medium">
                  {modalMode === 'create' ? 'Create Global Setting' : 'Edit Global Setting'}
                </h3>
                <Button
                  isIconOnly
                  variant="bordered"
                  color="danger"
                  onPress={() => {
                    onClose();
                    setModalMode(null);
                  }}
                >
                  <FaTimes />
                </Button>
              </DrawerHeader>
              <DrawerBody>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    id="config-key"
                    label="Config Name"
                    description={`Specify the unique key for this global setting. (e.g. "max_login_attempts", "site_title")`}
                    value={formData.config_key}
                    onValueChange={(e) => setFormData({ ...formData, config_key: e })}
                    classNames={{
                      inputWrapper: 'bg-backgroundSecondary border border-border group-data-[focus=true]:border-border group-data-[focus=true]:bg-background data-[hover=true]:bg-backgroundSecondary',
                      input: 'text-text group-data-[has-value=true]:text-text',
                      label: 'text-text',
                    }}
                  />
                  <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-background/50">
                    <div className="grid grid-cols-3 gap-3 items-end">
                      <p className="col-span-12 text-sm text-text">Add a new key-value pair to the config value</p>
                      <div className="col-span-12 sm:col-span-4">
                        <Input
                          size="sm"
                          label=''
                          placeholder={'Key'}
                          variant="bordered"
                          classNames={{
                            inputWrapper: 'bg-backgroundSecondary border border-border group-data-[focus=true]:border-border',
                            input: 'text-text',
                          }}
                          value={customConfigValueInput.key}
                          onValueChange={(value) =>
                            setCustomConfigValueInput({ ...customConfigValueInput, key: value })
                          }
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-6">
                        <Input
                          size="sm"
                          label=''
                          placeholder={'Value'}
                          variant="bordered"
                          classNames={{
                            inputWrapper: 'bg-backgroundSecondary border border-border group-data-[focus=true]:border-border',
                            input: 'text-text',
                          }}
                          value={customConfigValueInput.value}
                          onValueChange={(value) =>
                            setCustomConfigValueInput({ ...customConfigValueInput, value: value })
                          }
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-2">
                        <Button
                          color="primary"
                          size="sm"
                          className="w-full font-medium"
                          startContent={<FiPlus />}
                          onPress={() => {
                            // Only allow if config_value.type and value are non-empty strings
                            if (
                              !customConfigValueInput.key ||
                              !customConfigValueInput.value
                            ) {
                              return;
                            }
                            setFormData({
                              ...formData,
                              config_value: { ...formData.config_value, [customConfigValueInput.key]: customConfigValueInput.value },
                            });
                            setCustomConfigValueInput({ key: '', value: '' });
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    {(() => {
                      let parsedConfigValue = formData.config_value;

                      // Convert string to object if necessary and if it's not empty
                      if (
                        typeof formData.config_value === 'string' &&
                        formData.config_value.trim() !== ''
                      ) {
                        try {
                          parsedConfigValue = JSON.parse(formData.config_value);
                        } catch (e) {
                          // Malformed JSON or not an object, fallback to empty object
                          parsedConfigValue = {};
                        }
                      }

                      return (
                        parsedConfigValue &&
                        typeof parsedConfigValue === 'object' &&
                        Object.keys(parsedConfigValue).length > 0 && (
                          <div className="flex flex-col gap-2 p-2 border border-border rounded-md">
                            {Object.entries(parsedConfigValue).map(([key, value], index) => (
                              <div
                                key={index}
                                className="group grid grid-cols-12 gap-1 items-center rounded-md transition-colors"
                              >
                                <div className="col-span-12 sm:col-span-4">
                                  <Input
                                    size="sm"
                                    variant="bordered"
                                    aria-label="Contact Type"
                                    classNames={{
                                      inputWrapper: 'bg-backgroundSecondary border-1 border-border',
                                      input: 'text-text',
                                    }}
                                    value={key}
                                    onValueChange={(val) => {
                                      const newValues = { ...parsedConfigValue };
                                      newValues[val] = value;
                                      const jsonValue = typeof formData.config_value === 'string'
                                        ? JSON.stringify(newValues)
                                        : newValues;
                                      setFormData({ ...formData, config_value: jsonValue });
                                    }}
                                  />
                                </div>
                                <div className="col-span-12 sm:col-span-7">
                                  <Input
                                    size="sm"
                                    variant="bordered"
                                    aria-label="Contact Value"
                                    classNames={{
                                      inputWrapper: 'bg-backgroundSecondary border-1 border-border',
                                      input: 'text-text',
                                    }}
                                    value={value}
                                    onValueChange={(val) => {
                                      const newValues = { ...parsedConfigValue };
                                      newValues[key] = val;
                                      const jsonValue = typeof formData.config_value === 'string'
                                        ? JSON.stringify(newValues)
                                        : newValues;
                                      setFormData({ ...formData, config_value: jsonValue });
                                    }}
                                  />
                                </div>
                                <div className="col-span-12 sm:col-span-1 flex justify-end sm:justify-center">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => {
                                      const newValues = { ...parsedConfigValue };
                                      delete newValues[key];
                                      const jsonValue = typeof formData.config_value === 'string'
                                        ? JSON.stringify(newValues)
                                        : newValues;
                                      setFormData({ ...formData, config_value: jsonValue });
                                    }}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })()}
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button color="primary" onPress={() => handleUpsert()}>
                  Save
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmationModal
        isOpen={isDeleteOpen !== ''}
        onClose={() => setIsDeleteOpen('')}
        onConfirm={() => handleDelete(isDeleteOpen)}
        title="Confirmation"
        message={`Are you sure you want to delete this Global Setting?`}
      />
    </div>
  );
}
