"use client";

import { useEffect, useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PermissionData } from "./types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PermissionSelectorProps {
    allPermissions: PermissionData[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    readOnly?: boolean;
}

export function PermissionSelector({ allPermissions, selectedIds, onChange, readOnly = false }: PermissionSelectorProps) {

    // Helper: Get children of a permission
    const getChildren = (parentId: number) => allPermissions.filter(p => p.parent_id === parentId);

    // Helper: Get root permissions
    const rootPermissions = useMemo(() => allPermissions.filter(p => !p.parent_id), [allPermissions]);

    const handleToggle = (id: number, checked: boolean) => {
        if (readOnly) return;

        let newSelected = [...selectedIds];
        const perm = allPermissions.find(p => p.id === id);
        if (!perm) return;

        // Logic 1: If Parent is toggled, toggle all children matches
        const children = getChildren(id);
        const childIds = children.map(c => c.id);

        if (checked) {
            // Add self
            if (!newSelected.includes(id)) newSelected.push(id);
            // Add all children
            childIds.forEach(cid => {
                if (!newSelected.includes(cid)) newSelected.push(cid);
            });
        } else {
            // Remove self
            newSelected = newSelected.filter(sid => sid !== id);
            // Remove all children
            newSelected = newSelected.filter(sid => !childIds.includes(sid));
        }

        // Logic 2: If Child is toggled...
        if (perm.parent_id) {
            if (checked) {
                // Add self
                if (!newSelected.includes(id)) newSelected.push(id);

                // Check if all siblings are now checked -> Auto-check Parent
                const siblings = getChildren(perm.parent_id);
                const allSiblingsChecked = siblings.every(s => newSelected.includes(s.id)); // Note: newSelected has the current one added above

                if (allSiblingsChecked) {
                    if (!newSelected.includes(perm.parent_id)) newSelected.push(perm.parent_id);
                }
            } else {
                // Remove self
                newSelected = newSelected.filter(sid => sid !== id);

                // Uncheck Parent (since not all children are checked anymore)
                if (newSelected.includes(perm.parent_id)) {
                    newSelected = newSelected.filter(sid => sid !== perm.parent_id);
                }
            }
        }

        onChange(newSelected);
    };

    return (
        <div className="space-y-4">
            {rootPermissions.map(parent => {
                const children = getChildren(parent.id);
                const isParentChecked = selectedIds.includes(parent.id);
                const isIndeterminate = children.some(c => selectedIds.includes(c.id)) && !isParentChecked; // Partial selection, parent not fully checked

                return (
                    <div key={parent.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id={`perm-${parent.id}`}
                                checked={isParentChecked || (isIndeterminate ? "indeterminate" : false)}
                                onCheckedChange={(c) => handleToggle(parent.id, c as boolean)}
                                disabled={readOnly}
                            />
                            <Label htmlFor={`perm-${parent.id}`} className="font-bold text-lg cursor-pointer">{parent.description}</Label>
                        </div>

                        {children.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 mt-2">
                                {children.map(child => (
                                    <div key={child.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`perm-${child.id}`}
                                            checked={selectedIds.includes(child.id)}
                                            onCheckedChange={(c) => handleToggle(child.id, c as boolean)}
                                            disabled={readOnly}
                                        />
                                        <Label htmlFor={`perm-${child.id}`} className="cursor-pointer text-sm">{child.description}</Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
