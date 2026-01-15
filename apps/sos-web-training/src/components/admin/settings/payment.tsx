'use client'
import { Input, useDisclosure, addToast, SelectItem, Button, Card, CardBody, Table, Pagination, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Modal, ModalContent, ModalHeader, ModalBody, Textarea, ModalFooter, Checkbox } from "@heroui/react";
import dayjs from "dayjs";
import { useState } from "react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import ConfirmationModal from "../../forms/ConfirmationModal";
import { SelectWithClassName } from "../../forms/selectWithClassName";
import { CreateSubscriptionPlanDto, SubscriptionPlan, useSubscriptionPlanCreate, useSubscriptionPlanDelete, useSubscriptionPlans, useSubscriptionPlanUpdate } from "@/hooks/api/use-subscription";

export function PaymentList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<{
    name?: string;
    isactive?: boolean;
    currency?: string;
    limit?: number;
    offset?: number;
  }>({
    name: undefined,
    isactive: undefined,
    currency: undefined,
    limit: undefined,
    offset: undefined,
  });
  const { data, isLoading } = useSubscriptionPlans({
    name: search || undefined,
    isactive: filter.isactive || undefined,
    currency: filter.currency || undefined,
    limit: filter.limit || undefined,
    offset: filter.offset || undefined,
  });

  const createPlan = useSubscriptionPlanCreate();
  const updatePlan = useSubscriptionPlanUpdate();
  const deletePlan = useSubscriptionPlanDelete();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<CreateSubscriptionPlanDto>({
    name: '',
    description: '',
    plan_code: '',
    price: 0,
    currency: '',
    billing_cycle: '',
    trial_days: 0,
    is_active: false,
    features: [],
    limits: {},
    max_users: 0,
    max_athletes: 0,
    max_coaches: 0,
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState<string>('');

  const handleOpen = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description,
        plan_code: plan.plan_code,
        price: plan.price,
        currency: plan.currency,
        billing_cycle: plan.billing_cycle,
        trial_days: plan.trial_days,
        is_active: plan.is_active,
        features: plan.features || {},
        limits: plan.limits || {},
        max_users: plan.max_users,
        max_athletes: plan.max_athletes,
        max_coaches: plan.max_coaches,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        plan_code: '',
        price: 0,
        currency: '',
        billing_cycle: '',
        trial_days: 0,
        is_active: false,
        features: [],
        limits: {},
        max_users: 0,
        max_athletes: 0,
        max_coaches: 0,
      });
    }
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, plan: formData });
        addToast({ title: 'Plan updated successfully', color: 'success' });
      } else {
        console.log(formData);
        await createPlan.mutateAsync(formData);
        addToast({ title: 'Plan created successfully', color: 'success' });
      }
      onClose();
    } catch (error) {
      addToast({ title: `Failed to ${editingPlan ? 'update' : 'create'} plan`, color: 'danger' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      addToast({ title: 'Plan deleted successfully', color: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to delete plan', color: 'danger' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search plans..."
          value={search}
          onValueChange={setSearch}
          startContent={<FiSearch className="text-text" />}
          classNames={{
            inputWrapper:
              'px-2 border-border border-2 group-data-[focus=true]:border-border bg-backgroundSecondary',
            label: 'text-text text-sm',
            input: 'text-text',
          }}
          className="flex-1"
        />
        <SelectWithClassName
          id="status"
          selectedKeys={filter.isactive ? [filter.isactive.toString()] : ['all']}
          onSelectionChange={(keys) => {
            if (keys.currentKey === 'all') {
              setFilter({ ...filter, isactive: undefined })
            } else {
              setFilter({ ...filter, isactive: keys.currentKey === 'true' ? true : false })
            }
          }}
          selectorIconColor="text-text"
          classNames={{
            base: 'w-40',
            trigger: 'bg-backgroundSecondary border-border data-[open=true]:border-border',
            label: 'text-text',
            value: 'text-text group-data-[has-value=true]:text-text',
            listbox: 'rounded-md border border-border data-[hover=true]:bg-backgroundSecondary',
            selectorIcon: 'text-text',
          }}
          children={
            <>
              <SelectItem key="all" textValue="All Status">
                All
              </SelectItem>
              <SelectItem key={'true'} textValue="Active">
                Active
              </SelectItem>
              <SelectItem key={'false'} textValue="Inactive">
                Inactive
              </SelectItem>
            </>
          }
        />
        <Button
          color="primary"
          onPress={() => handleOpen()}
          startContent={<FiPlus className="text-white" />}
        >
          New Plan
        </Button>
      </div>

      <Card className="bg-backgroundSecondary border border-border">
        <CardBody>
          <Table
            aria-label="Plans table"
            removeWrapper
            bottomContent={
              data && data.length > 0 && (
                <div className="flex justify-center items-center">
                  <Pagination
                    total={data?.length || 0}
                    page={filter.offset || 1}
                    onChange={(page) => {
                      setFilter({ ...filter, offset: page });
                    }}
                  />
                </div>
              )
            }
          >
            <TableHeader>
              <TableColumn>Title</TableColumn>
              <TableColumn>Details</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Created</TableColumn>
              <TableColumn width={100} align="center">Actions</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={isLoading}
              loadingContent={
                <TableRow>
                  <TableCell colSpan={5} className="text-text text-center">
                    <Spinner label="Loading..." />
                  </TableCell>
                </TableRow>
              }
              emptyContent={
                <span>
                  {isLoading ? (
                    <>
                      <Spinner label="Loading..." />
                      <br />
                      Loading...
                    </>
                  ) : (
                    "No Plans found"
                  )}
                </span>
              }
            >
              {data && data.length > 0 ? (
                data.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="text-text">{plan.name}</TableCell>
                    <TableCell className="text-text text-sm">
                      {plan.description ? plan.description.substring(0, 100) + '...' : '-'}
                    </TableCell>
                    <TableCell className={`text-${plan.is_active ? 'success' : 'danger'} text-sm`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </TableCell>
                    <TableCell className="text-text text-sm">
                      {dayjs(plan.created_at).format('MM/DD/YYYY')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="primary"
                          onPress={() => handleOpen(plan)}
                        >
                          <FiEdit2 className="text-white" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="solid"
                          color="danger"
                          onPress={() => {
                            setIsDeleteOpen(plan.id!);
                          }}
                        >
                          <FiTrash2 className="text-white" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-text text-center">
                    No plans found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        className="bg-backgroundSecondary"
      >
        <ModalContent>
          <ModalHeader>{editingPlan ? 'Edit Plan' : 'Create Plan'}</ModalHeader>
          <ModalBody>
            <Input
              label="Name"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
            />
            <Textarea
              label="Plan Description"
              value={formData.description ?? ''}
              onValueChange={(value) => setFormData({ ...formData, description: value })}
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
              minRows={2}
            />
            {editingPlan ? (
              <Checkbox
                isSelected={formData.is_active}
                onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                classNames={{
                  label: 'text-text',
                }}
              >
                Active
              </Checkbox>
            ) : null}

            <Input
              label="Plan Code"
              value={formData.plan_code}
              onValueChange={(value) => setFormData({ ...formData, plan_code: value })}
              classNames={{
                inputWrapper:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                input: 'text-text',
              }}
            />

            <div className="flex gap-2">
              <Input
                type="number"
                label="Price"
                value={formData.price.toString()}
                onValueChange={(value) => setFormData({ ...formData, price: Number(value) })}
                classNames={{
                  inputWrapper:
                    'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                  input: 'text-text',
                }}
              />

              <SelectWithClassName
                label="Currency"
                selectedKeys={[formData.currency]}
                onSelectionChange={(value) =>
                  value && value.currentKey && setFormData({ ...formData, currency: value.currentKey })
                }
                classNames={{
                  base: 'w-64',
                  trigger:
                    'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                  label: 'text-text',
                }}
                children={
                  <>
                    <SelectItem key="USD">USD</SelectItem>
                    <SelectItem key="THB">THB</SelectItem>
                  </>
                }
              />
            </div>

            <SelectWithClassName
              label="Billing Cycle"
              selectedKeys={[formData.billing_cycle]}
              onSelectionChange={(value) =>
                value && value.currentKey && setFormData({ ...formData, billing_cycle: value.currentKey })
              }
              classNames={{
                base: 'w-64',
                trigger:
                  'bg-backgroundSecondary border-border border-2 group-data-[focus=true]:border-border',
                label: 'text-text',
              }}
              children={
                <>
                  <SelectItem key="MONTHLY">Monthly</SelectItem>
                  <SelectItem key="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem key="YEARLY">Yearly</SelectItem>
                </>
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={onClose} className="text-text">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={createPlan.isPending || updatePlan.isPending}
            >
              {editingPlan ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteOpen !== ''}
        onClose={() => setIsDeleteOpen('')}
        onConfirm={() => handleDelete(isDeleteOpen)}
        title="Confirmation"
        message={`Are you sure you want to delete this Plan?`}
      />
    </div>
  );
}